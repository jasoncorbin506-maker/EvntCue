"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Update one seed-milestone's override on events.milestone_overrides.
 *
 * Seed milestones come from data/event-milestones.ts. They are computed pins,
 * not DB rows — so per-user adjustments (mark done, dismiss, reschedule, bump
 * sort order) live in the events.milestone_overrides JSONB column, keyed by
 * the stable milestone key.
 *
 * This action is the single entry point for all four override types. Pass any
 * combination of patch fields; pass `null` to clear a specific field. The
 * action does a JSONB merge under the hood — other override keys remain
 * untouched.
 *
 * Special case: passing `{ status: null, customDateIso: null, customTime: null,
 * sortOrder: null }` removes the entire override entry for that key, returning
 * the milestone to its seed defaults.
 *
 * RLS on events.UPDATE enforces tenant ownership. No service-role needed.
 */
export type SeedMilestoneOverride = {
  status?: "done" | "dismissed" | null;
  customDateIso?: string | null;
  customTime?: string | null;
  sortOrder?: number | null;
};

export async function updateSeedMilestone(input: {
  eventId: string;
  milestoneKey: string;
  patch: SeedMilestoneOverride;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.milestoneKey || !input.eventId) {
    return { ok: false, error: "Missing eventId or milestoneKey" };
  }

  if (input.patch.customDateIso != null && !/^\d{4}-\d{2}-\d{2}$/.test(input.patch.customDateIso)) {
    return { ok: false, error: "Invalid date format" };
  }
  if (input.patch.customTime != null && !/^\d{2}:\d{2}(:\d{2})?$/.test(input.patch.customTime)) {
    return { ok: false, error: "Invalid time format" };
  }

  const supabase = await createClient();

  const { data: row, error: readErr } = await supabase
    .from("events")
    .select("milestone_overrides")
    .eq("id", input.eventId)
    .single();
  if (readErr || !row) {
    return { ok: false, error: readErr?.message ?? "Event not found" };
  }

  const overrides = (row.milestone_overrides as Record<string, Record<string, unknown>> | null) ?? {};
  const current = (overrides[input.milestoneKey] as Record<string, unknown> | undefined) ?? {};
  const next: Record<string, unknown> = { ...current };

  if ("status" in input.patch) {
    if (input.patch.status === null) delete next.status;
    else next.status = input.patch.status;
  }
  if ("customDateIso" in input.patch) {
    if (input.patch.customDateIso === null) delete next.custom_date_iso;
    else next.custom_date_iso = input.patch.customDateIso;
  }
  if ("customTime" in input.patch) {
    if (input.patch.customTime === null) delete next.custom_time;
    else next.custom_time = input.patch.customTime;
  }
  if ("sortOrder" in input.patch) {
    if (input.patch.sortOrder === null) delete next.sort_order;
    else next.sort_order = input.patch.sortOrder;
  }

  if (Object.keys(next).length === 0) {
    delete overrides[input.milestoneKey];
  } else {
    overrides[input.milestoneKey] = next;
  }

  const { error: writeErr } = await supabase
    .from("events")
    .update({ milestone_overrides: overrides })
    .eq("id", input.eventId);
  if (writeErr) {
    return { ok: false, error: writeErr.message };
  }

  revalidatePath("/orgnz");
  return { ok: true };
}
