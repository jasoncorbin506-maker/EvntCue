"use server";

import { cookies } from "next/headers";

/**
 * The user picked a specific date on the event-preview page. We persist it onto
 * the calc-state cookie so postAuthSeed reads it on signup and stamps the real
 * `events.start_date` row from it (instead of falling back to the horizon midpoint).
 *
 * No DB write here — the cookie is the only durable state pre-signup. If the user
 * never signs up the date evaporates with the cookie's 2h TTL.
 */
export async function updateSelectedDate(input: { iso: string }): Promise<void> {
  // Strict YYYY-MM-DD shape — anything else gets rejected so an invalid string
  // never propagates into events.start_date.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.iso)) return;

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

  c.set("evntcue_calc_state", JSON.stringify(parsed), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 2,
    path: "/",
  });
}
