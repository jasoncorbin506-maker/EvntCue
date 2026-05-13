"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Update a user-authored milestone — label, date, time, sort_order, detail,
 * or tradition_key. Pass only the fields you want to change; omit the rest.
 * Pass `null` to clear a nullable field (label, detail, custom_time,
 * sort_order, tradition_key).
 *
 * Used by:
 *   - RailDrawer's "Edit date" affordance on a custom pin
 *   - Up/down sort chevrons (sortOrder updates)
 *   - Marking-done on a custom pin? — no, "done" status applies to seeds only
 *     in v1. Custom pins don't track a done state separately yet (delete is
 *     the equivalent action for a custom pin that no longer applies).
 */
export async function updateCustomMilestone(input: {
  id: string;
  label?: string | null;
  detail?: string | null;
  customDateIso?: string;
  customTime?: string | null;
  sortOrder?: number | null;
  traditionKey?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.id) return { ok: false, error: "Missing id" };
  if (input.customDateIso && !/^\d{4}-\d{2}-\d{2}$/.test(input.customDateIso)) {
    return { ok: false, error: "Invalid date format" };
  }
  if (input.customTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(input.customTime)) {
    return { ok: false, error: "Invalid time format" };
  }

  const patch: Record<string, unknown> = {};
  if ("label" in input) patch.label = input.label === null ? null : input.label?.trim() || null;
  if ("detail" in input) patch.detail = input.detail === null ? null : input.detail?.trim() || null;
  if ("customDateIso" in input) patch.custom_date = input.customDateIso;
  if ("customTime" in input) patch.custom_time = input.customTime;
  if ("sortOrder" in input) patch.sort_order = input.sortOrder;
  if ("traditionKey" in input) patch.tradition_key = input.traditionKey;

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
