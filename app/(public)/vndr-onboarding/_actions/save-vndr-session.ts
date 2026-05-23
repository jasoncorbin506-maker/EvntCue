"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stage 0 Vndr handoff. Persists the calculator's slider state into
 * `landing_capture_sessions` (the same row family that the Orgnz
 * /budget-calculator → /event-preview funnel uses) then redirects into
 * the auth surface with the vndr role + claim_listing intent so V-1b's
 * Stages 1–4 capture can pick the row up via the session cookie.
 *
 * The columns we write live on `landing_capture_sessions` per migration 041:
 *   - vendor_category        : enum-ish text (null at Stage 0; Stage 1 sets)
 *   - vendor_zips            : text[] (null at Stage 0; Stage 2 sets)
 *   - vendor_avg_ticket_cents: int    (booking_amount × 100 — Stage 0 anchor)
 *   - vendor_current_bookings: int    (null at Stage 0; Stage 3 sets)
 *
 * portal_intent: 'vndr' (DB enum value matches the URL slug).
 */

export type TierPreference = "listed" | "pro" | null;

export type SaveVndrSessionPayload = {
  bookingAmount: number;       // dollars, already rounded by Calculator
  sliderValue: number;         // 0..100 — kept for analytics replay
  tierPreference: TierPreference;
};

export type SaveResult = { ok: false; error: string };

export async function saveAndAdvance(
  input: SaveVndrSessionPayload,
): Promise<SaveResult> {
  if (!Number.isFinite(input.bookingAmount) || input.bookingAmount < 500) {
    return { ok: false, error: "Booking estimate is out of range." };
  }
  if (
    !Number.isInteger(input.sliderValue) ||
    input.sliderValue < 0 ||
    input.sliderValue > 100
  ) {
    return { ok: false, error: "Slider state is invalid." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const ua = h.get("user-agent") || null;

  const sessionToken = randomUUID();
  const admin = createAdminClient();

  const { error } = await admin.from("landing_capture_sessions").insert({
    session_token: sessionToken,
    portal_intent: "vndr",
    email_captured: null,
    vendor_avg_ticket_cents: Math.round(input.bookingAmount * 100),
    ip_address: ip,
    user_agent: ua,
  });

  if (error) {
    return { ok: false, error: "Could not save right now. Try again." };
  }

  const c = await cookies();
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 2, // 2h, matches landing_capture_sessions.expires_at
    path: "/",
  };
  c.set("evntcue_capture_session", sessionToken, cookieOpts);
  c.set(
    "evntcue_vndr_stage0",
    JSON.stringify({
      bookingAmount: input.bookingAmount,
      sliderValue: input.sliderValue,
      tierPreference: input.tierPreference,
    }),
    cookieOpts,
  );

  // V-1b lives behind /login with the vndr role + claim_listing intent.
  // The login surface threads ?next= through auth.ts so post-auth lands on
  // the V-1b capture entry once it ships. Until then it lands at /vndr/discover
  // (404 placeholder per session 18k Door A smoke).
  redirect("/login?role=vndr&intent=claim_listing");
}
