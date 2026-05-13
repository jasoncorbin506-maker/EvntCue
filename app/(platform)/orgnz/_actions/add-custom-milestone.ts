"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Insert a single user-authored milestone into event_custom_milestones.
 *
 * Used by:
 *   - The free-text "Add custom milestone" form (CustomMilestoneForm)
 *   - The cultural traditions picker for single-add scenarios
 *
 * `label` is OPTIONAL on purpose. Some traditions are sacred — users may
 * want to block a time slot without disclosing what the ceremony is. The DB
 * column is nullable; the form respects this. See memory
 * `feedback_evntcue_sacred_ceremonies.md`.
 *
 * `tradition_key` is also optional — free-text adds with no culture tag are
 * fine. Picker-driven adds pass the tradition's culture key here so the
 * picker can dedupe future browses ("already on your timeline").
 */
export async function addCustomMilestone(input: {
  eventId: string;
  label: string | null;
  detail?: string | null;
  customDateIso: string;
  customTime?: string | null;
  traditionKey?: string | null;
  sortOrder?: number | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!input.eventId) return { ok: false, error: "Missing eventId" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.customDateIso)) {
    return { ok: false, error: "Invalid date format" };
  }
  if (input.customTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(input.customTime)) {
    return { ok: false, error: "Invalid time format" };
  }
  // Trim/normalize label. Empty string → null so we never store "" — the
  // application path treats null and "" identically anyway, and null is the
  // honest signal that the user chose not to name it.
  const label = input.label?.trim() || null;
  const detail = input.detail?.trim() || null;
  const tradition = input.traditionKey?.trim() || null;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("event_custom_milestones")
    .insert({
      event_id: input.eventId,
      label,
      detail,
      custom_date: input.customDateIso,
      custom_time: input.customTime ?? null,
      sort_order: input.sortOrder ?? null,
      tradition_key: tradition,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed" };
  }

  revalidatePath("/orgnz");
  return { ok: true, id: data.id as string };
}

/**
 * Bulk-insert ceremonies selected from the cultural traditions picker.
 * Each entry becomes one event_custom_milestones row. tradition_key carries
 * the parent culture (e.g., "hindu") for provenance + dedupe.
 *
 * Returns the inserted ids in input order so the UI can highlight the new
 * pins. Partial success is possible (RLS could deny one but not another);
 * the function returns the ids that did insert and an error per failure.
 */
export async function addCustomMilestonesBatch(input: {
  eventId: string;
  items: Array<{
    label: string;
    detail?: string | null;
    customDateIso: string;
    customTime?: string | null;
    traditionKey: string;
    ceremonyKey?: string | null;
  }>;
}): Promise<{ ok: true; ids: string[] } | { ok: false; error: string }> {
  if (!input.eventId) return { ok: false, error: "Missing eventId" };
  if (input.items.length === 0) return { ok: true, ids: [] };

  for (const item of input.items) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.customDateIso)) {
      return { ok: false, error: "Invalid date format" };
    }
    if (item.customTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(item.customTime)) {
      return { ok: false, error: "Invalid time format" };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const rows = input.items.map((item) => ({
    event_id: input.eventId,
    label: item.label.trim(),
    detail: item.detail?.trim() || null,
    custom_date: item.customDateIso,
    custom_time: item.customTime ?? null,
    sort_order: null,
    tradition_key: item.traditionKey,
    created_by: user.id,
  }));

  const { data, error } = await supabase
    .from("event_custom_milestones")
    .insert(rows)
    .select("id");

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Batch insert failed" };
  }

  revalidatePath("/orgnz");
  return { ok: true, ids: data.map((r) => r.id as string) };
}
