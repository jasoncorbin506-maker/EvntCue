"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * V-2c Session 1 (migration 058): vendor hard-deletes their OWN message
 * from an inquiry thread. RLS's im_delete policy gates this to
 * sender_user_id = auth.uid() — counter-party can't delete the vendor's
 * messages; admin override exists for support tooling.
 *
 * Per Jason 2026-05-25 session 24 lock: hard-delete (not soft) with 2-step
 * confirm at the UI layer. Counter-party sees the message disappear from
 * the thread; no "deleted by sender" placeholder. Cowork's call: "soft-
 * delete a sent message feels weird (the other party may have already
 * read it)."
 */

export type DeleteInquiryMessageResult =
  | { ok: true; deleted: boolean }
  | { ok: false; error: string };

export async function deleteInquiryMessage(
  messageId: string,
): Promise<DeleteInquiryMessageResult> {
  if (!messageId) return { ok: false, error: "Missing message id." };

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("inquiry_messages")
    .delete({ count: "exact" })
    .eq("id", messageId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vndr/inquiries");
  revalidatePath("/vndr");
  return { ok: true, deleted: (count ?? 0) > 0 };
}
