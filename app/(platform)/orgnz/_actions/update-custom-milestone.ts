"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isRoSPhaseKey } from "@/data/ros-phases";

/**
 * Update a user-authored milestone — label, date, time, sort_order, detail,
 * tradition_key, ros_phase, vendor_name, or vendor_contact_email. Pass only
 * the fields you want to change; omit the rest. Pass `null` to clear a
 * nullable field.
 *
 * Used by:
 *   - RailDrawer's "Edit date" affordance on a custom pin
 *   - Up/down sort chevrons (sortOrder updates)
 *   - The CustomMilestoneForm edit mode (all fields incl. rosPhase + vendor)
 *   - Marking-done on a custom pin? — no, "done" status applies to seeds only
 *     in v1. Custom pins don't track a done state separately yet (delete is
 *     the equivalent action for a custom pin that no longer applies).
 */
const VALID_ASSIGNMENT_STATUSES = new Set([
  "unowned",
  "vendor_assigned",
  "manually_defined",
  "resolved",
]);

export async function updateCustomMilestone(input: {
  id: string;
  label?: string | null;
  detail?: string | null;
  customDateIso?: string;
  customTime?: string | null;
  sortOrder?: number | null;
  traditionKey?: string | null;
  rosPhase?: string | null;
  vendorName?: string | null;
  vendorContactEmail?: string | null;
  /** Concept C lifecycle — caller flips this when work state changes
   *  (e.g., "resolved" when user marks the item complete from Open Items). */
  assignmentStatus?: "unowned" | "vendor_assigned" | "manually_defined" | "resolved";
  /** Day-of mode suppression flag (migration 050). */
  dayOfRelevant?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.id) return { ok: false, error: "Missing id" };
  if (input.customDateIso && !/^\d{4}-\d{2}-\d{2}$/.test(input.customDateIso)) {
    return { ok: false, error: "Invalid date format" };
  }
  if (input.customTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(input.customTime)) {
    return { ok: false, error: "Invalid time format" };
  }
  if (
    "rosPhase" in input &&
    input.rosPhase != null &&
    !isRoSPhaseKey(input.rosPhase)
  ) {
    return { ok: false, error: "Invalid Run-of-Show phase" };
  }
  if (
    "assignmentStatus" in input &&
    input.assignmentStatus !== undefined &&
    !VALID_ASSIGNMENT_STATUSES.has(input.assignmentStatus)
  ) {
    return { ok: false, error: "Invalid assignment status" };
  }

  const patch: Record<string, unknown> = {};
  if ("label" in input) patch.label = input.label === null ? null : input.label?.trim() || null;
  if ("detail" in input) patch.detail = input.detail === null ? null : input.detail?.trim() || null;
  if ("customDateIso" in input) patch.custom_date = input.customDateIso;
  if ("customTime" in input) patch.custom_time = input.customTime;
  if ("sortOrder" in input) patch.sort_order = input.sortOrder;
  if ("traditionKey" in input) patch.tradition_key = input.traditionKey;
  if ("rosPhase" in input) patch.ros_phase = input.rosPhase;
  if ("vendorName" in input) {
    patch.vendor_name = input.vendorName === null ? null : input.vendorName?.trim() || null;
  }
  if ("vendorContactEmail" in input) {
    patch.vendor_contact_email =
      input.vendorContactEmail === null
        ? null
        : input.vendorContactEmail?.trim() || null;
  }
  if ("assignmentStatus" in input) patch.assignment_status = input.assignmentStatus;
  if ("dayOfRelevant" in input) patch.day_of_relevant = input.dayOfRelevant;

  if (Object.keys(patch).length === 0) return { ok: true };

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_custom_milestones")
    .update(patch)
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/orgnz");
  return { ok: true };
}
