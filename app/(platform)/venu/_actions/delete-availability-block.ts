"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Hard-delete a venue availability block (migration 066). RLS
 * venue_vab_delete policy enforces venue_tenant_id ownership via
 * current_user_tenants(); a spoofed id from a different tenant deletes
 * zero rows.
 *
 * For Session A only manual-source blocks are user-deletable from the UI.
 * Session B's iCal/CSV blocks are removed via unsubscribe / re-import flows
 * rather than per-block delete (the worker layer owns those). This action
 * does not enforce that distinction — it'll happily delete any owned block —
 * but the UI calls it only on manual rows.
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
    .from("venue_availability_blocks")
    .delete({ count: "exact" })
    .eq("id", blockId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/venu/availability");
  revalidatePath("/venu/discover");
  return { ok: true, deleted: (count ?? 0) > 0 };
}
