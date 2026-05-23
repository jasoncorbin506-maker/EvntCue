"use server";

import { cookies } from "next/headers";

/**
 * The user picked a specific date (and optionally a specific time) on the
 * event-preview page. We persist both onto the calc-state cookie so
 * postAuthSeed reads them on signup and stamps the real `events.start_date`
 * + `events.start_time` row from them (instead of falling back to the
 * horizon midpoint with no time).
 *
 * Per F7 in decisions-log/2026-05-23-event-start-time-architecture.md —
 * time selector lives on /event-preview below the date selector. Time is
 * optional; NULL = all-day (Q3).
 *
 * No DB write here — the cookie is the only durable state pre-signup. If
 * the user never signs up the date + time evaporates with the cookie's
 * 2h TTL.
 */
export async function updateSelectedDate(input: {
  iso: string;
  timeIso?: string | null;
}): Promise<void> {
  // Strict YYYY-MM-DD shape — anything else gets rejected so an invalid
  // string never propagates into events.start_date.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.iso)) return;

  // Time: accept null (= all-day) or "HH:MM" / "HH:MM:SS" (24h). Anything
  // else gets coerced to null so a malformed string never propagates.
  let normalizedTime: string | null = null;
  if (input.timeIso != null && input.timeIso !== "") {
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(input.timeIso)) {
      // Pad seconds if missing
      normalizedTime = input.timeIso.length === 5
        ? `${input.timeIso}:00`
        : input.timeIso;
    } else {
      normalizedTime = null;
    }
  }

  const c = await cookies();
  const raw = c.get("evntcue_calc_state")?.value;
  if (!raw) return;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return;
  }

  parsed.selectedDateIso = input.iso;
  parsed.selectedTimeIso = normalizedTime;

  c.set("evntcue_calc_state", JSON.stringify(parsed), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 2,
    path: "/",
  });
}
