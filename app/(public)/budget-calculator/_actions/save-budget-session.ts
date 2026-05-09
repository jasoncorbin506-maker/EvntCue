"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CategoryKey,
  DateHorizon,
  EventTypeEnum,
  GuestBand,
} from "@/data/budget-presets";
import { CATEGORIES, dbHorizonFromUi, getSubtype } from "@/data/budget-presets";

export type CalcStatePayload = {
  category: CategoryKey;
  subtypeKey: string | null;
  guestCount: number;
  dateHorizon: DateHorizon;
  guestBand: GuestBand;
  amounts: Record<string, number>;
  contingencyPct: number;
  taxPct: number;
  subtotal: number;
  contingency: number;
  tax: number;
  grand: number;
};

/**
 * Items-step "Continue" handoff: saves a no-email session row and a state
 * cookie carrying the calculator's full breakdown, then redirects to the
 * event preview. Master spec §3603–3621 (Ghost Event pattern): user lands
 * in the dashboard teaser before being asked for an email.
 *
 * Email is captured later — either when the user signs up at the preview
 * CTA, or via the email-fallback modal on the preview page.
 */
export async function saveAndOpenPreview(input: CalcStatePayload): Promise<void> {
  if (!Number.isInteger(input.grand) || input.grand < 0) {
    throw new Error("Budget total is invalid.");
  }

  const category = CATEGORIES.find((c) => c.key === input.category);
  if (!category) throw new Error("Unknown event category.");

  let resolvedEventType: EventTypeEnum = category.eventTypeEnum;
  if (input.subtypeKey) {
    const sub = getSubtype(input.category, input.subtypeKey);
    if (sub) resolvedEventType = sub.eventTypeEnum;
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const ua = h.get("user-agent") || null;

  const sessionToken = randomUUID();
  const supabase = createAdminClient();
  const { error } = await supabase.from("landing_capture_sessions").insert({
    session_token: sessionToken,
    event_type: resolvedEventType,
    guest_count_range: input.guestBand,
    date_horizon: dbHorizonFromUi(input.dateHorizon),
    budget_estimate_cents: input.grand * 100,
    portal_intent: "orgnz",
    email_captured: null,
    ip_address: ip,
    user_agent: ua,
  });

  if (error) throw new Error("Could not save right now. Try again.");

  const c = await cookies();
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 2, // 2h, matches landing_capture_sessions.expires_at
    path: "/",
  };

  c.set("evntcue_capture_session", sessionToken, cookieOpts);
  c.set("evntcue_calc_state", JSON.stringify(input), cookieOpts);

  redirect("/event-preview");
}
