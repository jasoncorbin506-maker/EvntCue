"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Delete a vendor presence row from event_vendor_presence (migration 049).
 *
 * Used by VendorDetailSheet's delete button + Lock 22 undo-toast pattern
 * (the toast holds the deleted row in memory for ~8s with an "Undo" button
 * that re-INSERTs via addVendorPresence — V-1 doesn't preserve the id, so
 * the restored row gets a fresh id; that's acceptable for V-1 since no
 * other rows reference vendor_presence by id yet).
 *
 * Hard-delete (no soft-delete pattern on this table). Per Lock 22, the
 * forgiveness layer lives in the UI toast, not in the data layer.
 *
 * RLS-scoped client — migration 049's evp_delete policy uses
 * user_owns_event(event_id), so the authed user must own the parent event.
 * Filter by id alone is safe because RLS gates the row.
 */

export type DeleteVendorPresenceResult =
  | { ok: true; deleted: boolean }
  | { ok: false; error: string };

export async function deleteVendorPresence(
  presenceId: string,
): Promise<DeleteVendorPresenceResult> {
  if (!presenceId) return { ok: false, error: "Missing presence id." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error, count } = await supabase
    .from("event_vendor_presence")
    .delete({ count: "exact" })
    .eq("id", presenceId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/orgnz");
  // count === 0 means RLS denied the delete (row doesn't exist OR user
  // doesn't own the parent event). Both surface as `deleted: false` —
  // caller can render the appropriate UI message.
  return { ok: true, deleted: (count ?? 0) > 0 };
}
