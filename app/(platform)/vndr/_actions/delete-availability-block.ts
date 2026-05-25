"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Hard-delete a vendor availability block (migration 051). RLS vab_delete
 * policy enforces vendor_tenant_id ownership. Lock 22 forgiveness (undo
 * toast) lives in the UI layer if needed; for V-2b the delete is direct.
 */

export type DeleteAvailabilityBlockResult =
  | { ok: true; deleted: boolean }
  | { ok: false; error: string };

export async function deleteAvailabilityBlock(
  blockId: string,
): Promise<DeleteAvailabilityBlockResult> {
  if (!blockId) return { ok: false, error: "Missing block id." };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("vendor_availability_blocks")
    .delete({ count: "exact" })
    .eq("id", blockId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vndr");
  return { ok: true, deleted: (count ?? 0) > 0 };
}
