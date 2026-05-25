"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * Upsert a vendor availability block (migration 051). Used by
 * AvailabilityBlockSheet — both for new blocks (id undefined) and editing
 * an existing block's times/reason.
 *
 * Validates the TOD pair: both-or-neither + end > start when set. The DB
 * has the same CHECK; this guards before the round-trip for a clean
 * inline error.
 *
 * RLS-scoped: vab_insert/vab_update policies enforce vendor_tenant_id
 * membership via current_user_tenants() so a vendor can't write blocks on
 * another vendor's calendar even with a spoofed payload.
 */

export type UpsertAvailabilityBlockInput = {
  id?: string;
  blockedDate: string;
  startTime: string | null;
  endTime: string | null;
  reason?: string | null;
};

export type UpsertAvailabilityBlockResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isHHMMSS(s: string): boolean {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(s);
}

export async function upsertAvailabilityBlock(
  input: UpsertAvailabilityBlockInput,
): Promise<UpsertAvailabilityBlockResult> {
  if (!isIsoDate(input.blockedDate)) {
    return { ok: false, error: "Invalid date." };
  }
  const startSet = input.startTime !== null;
  const endSet = input.endTime !== null;
  if (startSet !== endSet) {
    return { ok: false, error: "Pick both start and end times, or neither." };
  }
  if (startSet && endSet) {
    if (!isHHMMSS(input.startTime!) || !isHHMMSS(input.endTime!)) {
      return { ok: false, error: "Invalid time format." };
    }
    if (input.endTime! <= input.startTime!) {
      return { ok: false, error: "End time must be after start time." };
    }
  }

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const payload = {
    vendor_tenant_id: vendor.tenantId,
    blocked_date: input.blockedDate,
    start_time: input.startTime,
    end_time: input.endTime,
    reason: input.reason ?? null,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("vendor_availability_blocks")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message ?? "Update failed." };
    }
    revalidatePath("/vndr");
    return { ok: true, id: data.id as string };
  }

  // Insert needs a created_by; the DB doesn't accept anon default. Pull it
  // from the auth user (RLS guarantees the user owns the vendor tenant).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("vendor_availability_blocks")
    .insert({ ...payload, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed." };
  }
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
