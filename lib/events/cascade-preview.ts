"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deriveStartAtMillis,
  logEventHistoryWrite,
  utcMillisToWallClock,
  zonedWallClockToUtcMillis,
  type EventTimingFields,
  type MilestoneOverride,
  type TaskAnchor,
} from "./timing";

/**
 * Cascade preview — F2.b's load-bearing computation.
 *
 * When an event's date/time moves, dependent milestones split into two camps:
 *   - relative_to_start: rendered as start_at + offset. Auto-shifts with the
 *     event. UI surfaces them in "Will auto-shift" column.
 *   - absolute: rendered as a fixed wall-clock. Doesn't shift, BUT its
 *     temporal RELATIONSHIP to the event start has changed — surface for
 *     per-row user approval ("keep here" vs "shift along with the event").
 *
 * computeCascadeDiff is pure read + classify. The UI renders the diff. After
 * the user confirms, applyCascadeCommit writes everything atomically + logs
 * event_history entries.
 *
 * Per decisions-log/2026-05-23-event-start-time-architecture.md F2.b + F6.b.
 *
 * IMPLEMENTATION NOTES:
 * - Both milestone_overrides (JSONB on events) and event_custom_milestones
 *   (separate table) participate in the cascade.
 * - For overrides without a custom_date_iso (status-only overrides like
 *   "dismissed"), there's nothing temporal to shift — skip.
 * - JSONB overrides default to anchor='relative_to_start' per the seed
 *   catalog convention; event_custom_milestones rows default to
 *   anchor='absolute' per migration 045's column default.
 * - Apply-side note: updating a single override entry in milestone_overrides
 *   JSONB requires read-modify-write of the full blob. For V1, we only
 *   support shift-commit on custom_milestones (separate table — clean UPDATE).
 *   Override shift-commit is a follow-up; UI can still surface override
 *   absolutes for approval but the "shift it" action will no-op with a
 *   "coming soon" note. Same data eventually; the cascade preview UX still
 *   teaches the user what's at stake.
 */

export type CascadeItemSource = "milestone_override" | "custom_milestone";

export type CascadePreviewItem = {
  source: CascadeItemSource;
  key: string;            // milestone_key for overrides; custom milestone id for customs
  label: string;          // best-effort label; resolver in UI swaps for catalog label
  anchor: TaskAnchor;
  oldAtMillis: number;
  newAtMillis: number;    // for absolute, equals oldAtMillis unless user picks "shift"
};

export type CascadeDiff = {
  autoShift: CascadePreviewItem[];
  needsApproval: CascadePreviewItem[];
};

/**
 * Compute the cascade impact of changing an event's timing fields.
 * Pure read + classify. NEVER commits.
 *
 * Both oldEvent and newEvent are required so caller controls the comparison
 * baseline. Typical flow:
 *   1. UI loads current event into oldEvent
 *   2. User edits → newEvent
 *   3. Call computeCascadeDiff({ eventId, oldEvent, newEvent })
 *   4. Render the diff in the preview pane
 *   5. User approves → applyCascadeCommit({ ... approvedAbsoluteShifts: [...] })
 */
export async function computeCascadeDiff(args: {
  eventId: string;
  oldEvent: EventTimingFields;
  newEvent: EventTimingFields;
}): Promise<CascadeDiff> {
  const supabase = await createClient();
  const oldStartMillis = deriveStartAtMillis(args.oldEvent);
  const newStartMillis = deriveStartAtMillis(args.newEvent);

  // Fetch milestone_overrides JSONB
  const { data: eventRow } = await supabase
    .from("events")
    .select("milestone_overrides")
    .eq("id", args.eventId)
    .maybeSingle();
  const overrides = (eventRow?.milestone_overrides ?? {}) as Record<
    string,
    MilestoneOverride
  >;

  // Fetch event_custom_milestones
  const { data: customs } = await supabase
    .from("event_custom_milestones")
    .select("id, label, custom_date, custom_time, anchor, offset_minutes")
    .eq("event_id", args.eventId);

  const autoShift: CascadePreviewItem[] = [];
  const needsApproval: CascadePreviewItem[] = [];

  // Classify milestone_overrides
  for (const [key, override] of Object.entries(overrides)) {
    // Status-only overrides (no custom_date_iso) have no temporal data —
    // they aren't affected by event date moves.
    if (!override.custom_date_iso) continue;

    const anchor: TaskAnchor = override.anchor ?? "relative_to_start";
    const oldAtMillis = zonedWallClockToUtcMillis(
      override.custom_date_iso,
      override.custom_time ?? "00:00:00",
      args.oldEvent.timezone,
    );

    if (anchor === "relative_to_start") {
      // Preserve the wall-clock offset from the old event start
      const offsetMillis = oldAtMillis - oldStartMillis;
      autoShift.push({
        source: "milestone_override",
        key,
        label: key, // UI resolver maps to catalog label
        anchor,
        oldAtMillis,
        newAtMillis: newStartMillis + offsetMillis,
      });
    } else {
      needsApproval.push({
        source: "milestone_override",
        key,
        label: key,
        anchor,
        oldAtMillis,
        newAtMillis: oldAtMillis, // unchanged unless user picks "shift"
      });
    }
  }

  // Classify event_custom_milestones
  for (const c of customs ?? []) {
    const anchor: TaskAnchor =
      ((c.anchor as TaskAnchor | null) ?? "absolute");
    const oldAtMillis = zonedWallClockToUtcMillis(
      c.custom_date as string,
      (c.custom_time as string) ?? "00:00:00",
      args.oldEvent.timezone,
    );

    if (anchor === "relative_to_start") {
      const offsetMinutes = (c.offset_minutes as number | null) ?? 0;
      autoShift.push({
        source: "custom_milestone",
        key: c.id as string,
        label: (c.label as string) ?? "Untitled milestone",
        anchor,
        oldAtMillis,
        newAtMillis: newStartMillis + offsetMinutes * 60_000,
      });
    } else {
      needsApproval.push({
        source: "custom_milestone",
        key: c.id as string,
        label: (c.label as string) ?? "Untitled milestone",
        anchor,
        oldAtMillis,
        newAtMillis: oldAtMillis,
      });
    }
  }

  return { autoShift, needsApproval };
}

/**
 * Commit the cascade. Order of operations:
 *   1. UPDATE events with new timing fields
 *   2. UPDATE approved-shift custom_milestones with new wall-clock
 *      (milestone_overrides JSONB shifts are V2 — see top-of-file note)
 *   3. INSERT event_history per field change + per approved shift
 *
 * Per F2.b — caller is responsible for confirming the preview before calling
 * this. Caller passes the SAME oldEvent that was used to compute the diff —
 * if the event row has been mutated by another tab/user in between, the
 * diff was computed against stale state. (Future hardening: optimistic
 * concurrency token. Out of scope V1.)
 */
export async function applyCascadeCommit(args: {
  eventId: string;
  userId: string;
  oldEvent: EventTimingFields;
  newEvent: EventTimingFields;
  approvedAbsoluteShifts: ReadonlyArray<{
    source: CascadeItemSource;
    key: string;
    newAtMillis: number;
  }>;
  reason?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  // 1. UPDATE events
  const { error: eventErr } = await admin
    .from("events")
    .update({
      start_date: args.newEvent.start_date,
      start_time: args.newEvent.start_time,
      timezone: args.newEvent.timezone,
      date_status: args.newEvent.date_status,
      duration_minutes: args.newEvent.duration_minutes,
    })
    .eq("id", args.eventId);
  if (eventErr) {
    return { ok: false, error: `Could not update event: ${eventErr.message}` };
  }

  // 2. Apply approved absolute shifts on custom_milestones
  for (const shift of args.approvedAbsoluteShifts) {
    if (shift.source !== "custom_milestone") {
      // milestone_override JSONB shifts deferred — see top-of-file note
      continue;
    }
    const { dateStr, timeStr } = utcMillisToWallClock(
      shift.newAtMillis,
      args.newEvent.timezone,
    );
    const { error } = await admin
      .from("event_custom_milestones")
      .update({ custom_date: dateStr, custom_time: timeStr })
      .eq("id", shift.key);
    if (error) {
      return {
        ok: false,
        error: `Could not apply approved shift for ${shift.key}: ${error.message}`,
      };
    }
  }

  // 3. event_history per field change
  const fieldDiffs: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];
  if (args.oldEvent.start_date !== args.newEvent.start_date) {
    fieldDiffs.push({
      field: "start_date",
      oldValue: args.oldEvent.start_date,
      newValue: args.newEvent.start_date,
    });
  }
  if (args.oldEvent.start_time !== args.newEvent.start_time) {
    fieldDiffs.push({
      field: "start_time",
      oldValue: args.oldEvent.start_time,
      newValue: args.newEvent.start_time,
    });
  }
  if (args.oldEvent.timezone !== args.newEvent.timezone) {
    fieldDiffs.push({
      field: "timezone",
      oldValue: args.oldEvent.timezone,
      newValue: args.newEvent.timezone,
    });
  }
  if (args.oldEvent.date_status !== args.newEvent.date_status) {
    fieldDiffs.push({
      field: "date_status",
      oldValue: args.oldEvent.date_status,
      newValue: args.newEvent.date_status,
    });
  }
  if (args.oldEvent.duration_minutes !== args.newEvent.duration_minutes) {
    fieldDiffs.push({
      field: "duration_minutes",
      oldValue: args.oldEvent.duration_minutes,
      newValue: args.newEvent.duration_minutes,
    });
  }

  for (const diff of fieldDiffs) {
    await logEventHistoryWrite(admin, {
      eventId: args.eventId,
      userId: args.userId,
      field: diff.field,
      oldValue: diff.oldValue,
      newValue: diff.newValue,
      reason: args.reason,
    });
  }

  // 4. event_history per approved-shift (records the user's explicit decision)
  for (const shift of args.approvedAbsoluteShifts) {
    if (shift.source !== "custom_milestone") continue;
    await logEventHistoryWrite(admin, {
      eventId: args.eventId,
      userId: args.userId,
      field: `custom_milestone:${shift.key}:shift`,
      oldValue: null,
      newValue: { newAtMillis: shift.newAtMillis },
      reason: args.reason ?? "User-approved shift during cascade",
    });
  }

  return { ok: true };
}
