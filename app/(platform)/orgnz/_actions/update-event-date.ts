"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyCascadeCommit,
  computeCascadeDiff,
  type CascadeDiff,
} from "@/lib/events/cascade-preview";
import {
  dateStatusTransition,
  type DateStatus,
  type EventTimingFields,
} from "@/lib/events/timing";
import {
  CATEGORIES,
  getSubtype,
  leadTimeSeverityFromMonths,
  type CategoryKey,
  type LeadTimeSeverity,
} from "@/data/budget-presets";

const VALID_CATEGORIES: CategoryKey[] = [
  "wedding",
  "corporate",
  "nonprofit",
  "public",
  "social",
];

function toCategoryKey(eventType: string): CategoryKey {
  return (VALID_CATEGORIES as string[]).includes(eventType)
    ? (eventType as CategoryKey)
    : "social";
}

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.4375;

function monthsUntilIso(iso: string): number {
  const target = new Date(iso + "T00:00:00").getTime();
  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  return Math.max(0, (target - today) / (MS_PER_DAY * DAYS_PER_MONTH));
}

/**
 * F2.b cascade-aware event date/time edit action.
 *
 * Two-step API:
 *   1. mode="preview" — fetches current event timing, computes the cascade
 *      diff against the proposed new state, returns it to the UI. Does NOT
 *      write anything. The UI renders the preview pane (auto-shift +
 *      needs-approval columns).
 *   2. mode="commit" — given the preview diff was rendered and the user
 *      confirmed (optionally approving per-row shifts on absolute-anchored
 *      items), atomically updates events + custom_milestones + writes
 *      event_history rows. Per F2.b — never silent.
 *
 * RLS gate: queries via createClient() (authed user). The vendors / events
 * RLS policies enforce that only the owning tenant can read + write the
 * event row. event_history INSERT also goes via createClient(); the
 * eh_insert policy from migration 044 allows user_owns_event(event_id).
 *
 * Per decisions-log/2026-05-23-event-start-time-architecture.md F2.b + F3.b.
 */

export type UpdateEventDateInput = {
  mode: "preview" | "commit";
  eventId: string;
  newStartDate: string;          // "YYYY-MM-DD"
  newStartTime: string | null;   // "HH:MM:SS" or null = all-day
  newTimezone?: string;          // defaults to current event timezone
  newDateStatus?: DateStatus;    // defaults to current event date_status
  newDurationMinutes?: number | null;
  /** For commit mode only — per-row approvals from the preview pane. */
  approvedAbsoluteShifts?: ReadonlyArray<{
    source: "milestone_override" | "custom_milestone";
    key: string;
    newAtMillis: number;
  }>;
  reason?: string;
};

/**
 * Additional preview signals beyond the milestone cascade — surfaces the
 * "you promised warnings, deliver them" feedback (Jason 2026-05-23):
 *
 *   - leadSeverity: Cue-style severity for the new date given event_type/
 *     subtype recommended lead time + budget. UI renders a Cue grace note
 *     if "warn" or "danger".
 *   - bookedVendorCount: how many vendors have a committed booking
 *     (status IN confirmed/pending_venue_lock/completed). If > 0, UI
 *     surfaces "they'll need to be notified" + a coming-soon note (real
 *     vendor notification + re-acceptance flow is Phase 4 / V-2 work).
 */
export type PreviewSignals = {
  leadSeverity: LeadTimeSeverity;
  monthsUntilNewDate: number;
  recommendedLeadMonths: number;
  categoryKey: CategoryKey;
  bookedVendorCount: number;
};

export type UpdateEventDateResult =
  | {
      ok: "preview";
      diff: CascadeDiff;
      oldEvent: EventTimingFields;
      newEvent: EventTimingFields;
      signals: PreviewSignals;
    }
  | { ok: "committed" }
  | { ok: false; error: string };

export async function updateEventDateAction(
  input: UpdateEventDateInput,
): Promise<UpdateEventDateResult> {
  // Basic input validation (date shape, time shape, status enum, duration bounds)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.newStartDate)) {
    return { ok: false, error: "Date must be YYYY-MM-DD." };
  }
  let normalizedTime: string | null = null;
  if (input.newStartTime !== null) {
    const raw = input.newStartTime;
    if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) normalizedTime = raw;
    else if (/^\d{2}:\d{2}$/.test(raw)) normalizedTime = `${raw}:00`;
    else return { ok: false, error: "Time must be HH:MM or HH:MM:SS." };
  }
  if (
    input.newDateStatus &&
    !["tentative", "confirmed", "final"].includes(input.newDateStatus)
  ) {
    return { ok: false, error: "Invalid date_status." };
  }
  if (
    input.newDurationMinutes != null &&
    (!Number.isInteger(input.newDurationMinutes) ||
      input.newDurationMinutes < 15 ||
      input.newDurationMinutes > 10080)
  ) {
    return { ok: false, error: "Duration must be between 15 and 10080 minutes." };
  }

  // Auth-scoped read of the current event timing fields + the lookup
  // columns needed for the Cue lead-time warning (event_type / subtype /
  // budget). RLS gates this to the owning tenant.
  const supabase = await createClient();
  const { data: row, error: readErr } = await supabase
    .from("events")
    .select(
      "id, start_date, start_time, timezone, date_status, duration_minutes, event_type, event_subtype, budget_cents",
    )
    .eq("id", input.eventId)
    .maybeSingle();
  if (readErr || !row) {
    return { ok: false, error: "Could not load the event." };
  }

  const oldEvent: EventTimingFields = {
    start_date: row.start_date as string,
    start_time: (row.start_time as string | null) ?? null,
    timezone: row.timezone as string,
    date_status: row.date_status as DateStatus,
    duration_minutes: (row.duration_minutes as number | null) ?? null,
  };

  const newEvent: EventTimingFields = {
    start_date: input.newStartDate,
    start_time: normalizedTime,
    timezone: input.newTimezone ?? oldEvent.timezone,
    date_status: input.newDateStatus ?? oldEvent.date_status,
    duration_minutes:
      input.newDurationMinutes !== undefined
        ? input.newDurationMinutes
        : oldEvent.duration_minutes,
  };

  // Gate status transitions per F5.b
  if (newEvent.date_status !== oldEvent.date_status) {
    const transition = dateStatusTransition(
      oldEvent.date_status,
      newEvent.date_status,
    );
    if (!transition.allowed && !input.reason) {
      return { ok: false, error: transition.reason };
    }
  }

  if (input.mode === "preview") {
    const diff = await computeCascadeDiff({
      eventId: input.eventId,
      oldEvent,
      newEvent,
    });

    // Cue lead-time signal — recompute severity for the proposed new date
    // using the event's category/subtype recommended lead months. If the
    // new date is closer than 80% of recommended, surface a Cue warning.
    const categoryKey = toCategoryKey(row.event_type as string);
    const category = CATEGORIES.find((c) => c.key === categoryKey);
    const subtype = getSubtype(
      categoryKey,
      (row.event_subtype as string | null) ?? null,
    );
    const recommendedLeadMonths =
      subtype?.recommendedLeadMonths ?? category?.recommendedLeadMonths ?? 6;
    const monthsUntilNewDate = monthsUntilIso(input.newStartDate);
    const leadSeverity = leadTimeSeverityFromMonths(
      monthsUntilNewDate,
      recommendedLeadMonths,
      (row.budget_cents as number | null) ?? undefined,
    );

    // Booked vendor count — uses admin client because bookings RLS is
    // venue/vendor-scoped; orgnz needs visibility into "vendors committed
    // to my event" for the preview pane warning. Count-only query, no
    // PII surfaced beyond the integer.
    const admin = createAdminClient();
    const { count: bookedVendorCount } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("event_id", input.eventId)
      .in("status", ["confirmed", "pending_venue_lock", "completed"]);

    return {
      ok: "preview",
      diff,
      oldEvent,
      newEvent,
      signals: {
        leadSeverity,
        monthsUntilNewDate,
        recommendedLeadMonths,
        categoryKey,
        bookedVendorCount: bookedVendorCount ?? 0,
      },
    };
  }

  // mode === "commit"
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Your session expired. Sign in again." };
  }

  const commitResult = await applyCascadeCommit({
    eventId: input.eventId,
    userId: user.id,
    oldEvent,
    newEvent,
    approvedAbsoluteShifts: input.approvedAbsoluteShifts ?? [],
    reason: input.reason,
  });
  if (commitResult.ok === false) {
    return { ok: false, error: commitResult.error };
  }
  return { ok: "committed" };
}
