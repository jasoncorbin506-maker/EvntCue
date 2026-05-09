"use server";

import { headers, cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CategoryKey,
  DateHorizon,
  EventTypeEnum,
} from "@/data/budget-presets";
import { CATEGORIES, dbHorizonFromUi, getSubtype } from "@/data/budget-presets";

export type MegaScopingInput = {
  category: CategoryKey;
  subtypeKey?: string;
  dateHorizon: DateHorizon;
  email: string;
};

export type MegaScopingResult = { ok: true } | { ok: false; error: string };

/**
 * Mega-event scoping request — fires from the calculator's scope step
 * when the user pegs the slider at the 500-cover rail. We don't have a
 * real budget estimate yet (line items haven't been filled), so we save
 * the lead with budget_estimate_cents = NULL and rely on admin follow-up.
 */
export async function requestMegaScoping(input: MegaScopingInput): Promise<MegaScopingResult> {
  const trimmed = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: "Enter a valid email." };
  }

  const category = CATEGORIES.find((c) => c.key === input.category);
  if (!category) return { ok: false, error: "Unknown event category." };

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
    guest_count_range: "500_plus",
    date_horizon: dbHorizonFromUi(input.dateHorizon),
    budget_estimate_cents: null,
    portal_intent: "orgnz",
    email_captured: trimmed,
    ip_address: ip,
    user_agent: ua,
  });

  if (error) return { ok: false, error: "Could not save right now. Try again." };

  const c = await cookies();
  c.set("evntcue_capture_session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 2,
    path: "/",
  });

  return { ok: true };
}
