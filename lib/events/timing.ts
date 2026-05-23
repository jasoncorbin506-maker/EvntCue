import type { createAdminClient } from "@/lib/supabase/admin";

/**
 * Event timing primitives — shared types + helpers.
 *
 * Per decisions-log/2026-05-23-event-start-time-architecture.md, fully locked.
 * Migrations 043 + 044 + 045 supply the schema; this module gives app code
 * the typed surface to read/write/derive event timing.
 *
 * IMPORTANT — timezone math posture:
 * The canonical event-start TIMESTAMPTZ is computed by the SQL helper
 * `events_start_at(events)` (migration 043). SELECT it when you need the
 * canonical value. This module's `deriveStartAtMillis()` mirrors that math
 * in pure JS for client/server cases where we don't have a DB round-trip
 * (cascade preview computation, EventTime component rendering, etc.).
 *
 * No timezone library was added — the project has zero date/TZ deps and
 * we're keeping it that way. The Intl.DateTimeFormat round-trip trick
 * below handles arbitrary IANA timezones without an external library, at
 * the cost of a small per-call overhead (negligible for our use cases).
 *
 * Per F1.b, F3.b, F5.b, F6.b, Q1, Q3, Q5 from the decisions-log.
 */

export type DateStatus = "tentative" | "confirmed" | "final";
export type TaskAnchor = "relative_to_start" | "absolute";

/**
 * The subset of `events` columns needed to compute start_at + reason about
 * cascade. Use this shape when passing event data into the helpers; it
 * sidesteps full row pulls that include columns we don't need.
 */
export type EventTimingFields = {
  start_date: string;        // "YYYY-MM-DD"
  start_time: string | null; // "HH:MM:SS" or null = all-day (Q3)
  timezone: string;          // IANA TZ (e.g., "America/Chicago")
  date_status: DateStatus;
  duration_minutes: number | null;
};

/**
 * Per-entry shape of events.milestone_overrides JSONB. All fields optional;
 * presence determines what the override touches. Per the JSONB shape
 * comment updated in migration 045.
 */
export type MilestoneOverride = {
  status?: "done" | "dismissed";
  custom_date_iso?: string;  // "YYYY-MM-DD"
  custom_time?: string;       // "HH:MM:SS"
  sort_order?: number;
  anchor?: TaskAnchor;
  offset_minutes?: number;
};

/**
 * Args for logEventHistoryWrite(). Per F3.b — append-only audit table.
 */
export type EventHistoryWrite = {
  eventId: string;
  userId: string | null;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason?: string;
};

/**
 * Default duration_minutes for single-day events that haven't specified one.
 * 4 hours covers most receptions / corporate events / parties. Phase 4
 * escrow "48 hrs after the event" uses this when duration is unset.
 * Per Q5 in the decisions-log.
 */
export const DEFAULT_SINGLE_DAY_DURATION_MINUTES = 240;

// ─── Timezone math ──────────────────────────────────────────────────────────

/**
 * Wall-clock (date + time, interpreted as local time in `tz`) → UTC millis.
 * Mirror of Postgres `(date + COALESCE(time, '00:00')) AT TIME ZONE tz`.
 *
 * Implementation: format a known UTC instant in the target TZ via
 * Intl.DateTimeFormat, then back out the offset. Works for any IANA TZ
 * including DST-aware zones.
 *
 * Throws on invalid input rather than returning NaN — caller must validate
 * inputs before calling.
 */
export function zonedWallClockToUtcMillis(
  dateStr: string,
  timeStr: string,
  tz: string,
): number {
  const normalized = normalizeTimeString(timeStr);
  const naiveUtc = Date.parse(`${dateStr}T${normalized}Z`);
  if (Number.isNaN(naiveUtc)) {
    throw new Error(
      `zonedWallClockToUtcMillis: invalid inputs ${JSON.stringify({ dateStr, timeStr, tz })}`,
    );
  }

  // Format the naive-UTC instant AS IF it were in the target TZ. Compare to
  // the input wall-clock; the delta is the offset we need to subtract from
  // naiveUtc to get the canonical UTC instant for this wall-clock in tz.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(naiveUtc));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = get("hour");
  const tzAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    // Intl returns 24 for midnight in some TZs (en-US hourCycle quirk); coerce.
    hour === 24 ? 0 : hour,
    get("minute"),
    get("second"),
  );
  const offset = tzAsUtc - naiveUtc;
  return naiveUtc - offset;
}

/**
 * UTC millis → wall-clock (date + time) in `tz`. The inverse of
 * zonedWallClockToUtcMillis.
 */
export function utcMillisToWallClock(
  millis: number,
  tz: string,
): { dateStr: string; timeStr: string } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(millis));
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour");
  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    timeStr: `${hour === "24" ? "00" : hour}:${get("minute")}:${get("second")}`,
  };
}

/**
 * Best-effort JS mirror of SQL `events_start_at(e)`. Uses Q3 NULL-all-day
 * rule. For the canonical value query the SQL helper.
 */
export function deriveStartAtMillis(event: EventTimingFields): number {
  return zonedWallClockToUtcMillis(
    event.start_date,
    event.start_time ?? "00:00:00",
    event.timezone,
  );
}

function normalizeTimeString(timeStr: string): string {
  // "9:00" or "09:00" → "09:00:00"; "09:00:00" stays.
  const parts = timeStr.split(":");
  const h = (parts[0] ?? "0").padStart(2, "0");
  const m = (parts[1] ?? "0").padStart(2, "0");
  const s = (parts[2] ?? "0").padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ─── date_status transitions ────────────────────────────────────────────────

export type StatusTransition =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Gate date_status transitions. Per F5.b:
 *   - tentative → confirmed: free (typical path; happens when first vendor accepts)
 *   - confirmed → final: free (manual lock-in, typically ~14 days out)
 *   - any → backward (final → confirmed/tentative; confirmed → tentative):
 *     requires explicit caller override + reason text. This helper signals
 *     not allowed; caller decides whether to override.
 *   - tentative → final: allowed but unusual (skips the confirmed step);
 *     caller may want to surface a warning UI.
 */
export function dateStatusTransition(
  from: DateStatus,
  to: DateStatus,
): StatusTransition {
  if (from === to) return { allowed: true };
  if (from === "final" && to !== "final") {
    return {
      allowed: false,
      reason:
        "Date is final — requires explicit override + reason text to change status backward.",
    };
  }
  if (from === "confirmed" && to === "tentative") {
    return {
      allowed: false,
      reason:
        "Date is confirmed — moving back to tentative invalidates vendor calendar locks. Requires explicit override + reason text.",
    };
  }
  return { allowed: true };
}

// ─── event_history writer ───────────────────────────────────────────────────

/**
 * Append an event_history entry. Per F3.b — table is append-only (no UPDATE
 * or DELETE policy). Caller passes admin client; eh_insert policy allows
 * `user_owns_event(event_id)` so the RLS-scoped server client would also
 * work, but admin keeps writes uniform across postAuthSeed (no auth context)
 * and authed edit paths.
 *
 * old_value / new_value are typed `unknown` — caller passes whatever JSONB-
 * serializable shape makes sense for the field. Common patterns:
 *   - start_date: "YYYY-MM-DD" (string)
 *   - start_time: "HH:MM:SS" or null (string | null)
 *   - timezone: "America/Chicago" (string)
 *   - date_status: "tentative" | "confirmed" | "final" (string)
 *   - duration_minutes: integer or null (number | null)
 *   - cascade-shifted milestones: { source, key, oldAtIso, newAtIso } (object)
 */
export async function logEventHistoryWrite(
  admin: ReturnType<typeof createAdminClient>,
  entry: EventHistoryWrite,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin.from("event_history").insert({
    event_id: entry.eventId,
    field: entry.field,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
    changed_by: entry.userId,
    reason: entry.reason ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── milestone anchor resolution ────────────────────────────────────────────

/**
 * Resolve a seed milestone's effective anchor + offset for cascade-preview
 * classification. Defaults:
 *   - anchor: 'relative_to_start' (the existing seed catalog convention —
 *     every milestone keys off the event date)
 *   - offsetMinutes: -lead × 30 × 24 × 60 (lead is months-before; convert)
 *
 * Per F6.b — the discriminator that makes the cascade preview correct. A
 * milestone with explicit `anchor: 'absolute'` doesn't shift on event date
 * change (gets surfaced for user approval).
 */
export function milestoneEffectiveAnchor(milestone: {
  lead: number;
  anchor?: TaskAnchor;
  offsetMonths?: number;
  offsetMinutes?: number;
}): { anchor: TaskAnchor; offsetMinutes: number } {
  const anchor = milestone.anchor ?? "relative_to_start";
  let offsetMinutes: number;
  if (milestone.offsetMinutes != null) {
    offsetMinutes = milestone.offsetMinutes;
  } else if (milestone.offsetMonths != null) {
    offsetMinutes = Math.round(milestone.offsetMonths * 30 * 24 * 60);
  } else {
    // Default: -lead months (lead is positive months-before-event)
    offsetMinutes = Math.round(-milestone.lead * 30 * 24 * 60);
  }
  return { anchor, offsetMinutes };
}
