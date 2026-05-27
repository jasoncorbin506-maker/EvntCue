"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";

/**
 * Organizer hard-deletes their OWN sent message. Mirrors the vndr-side
 * action; RLS's im_delete (mig 061) gates the DELETE to
 * sender_user_id = auth.uid() — counter-party cannot delete the
 * organizer's messages. Per Jason's 2026-05-25 lock: hard-delete with
 * 2-step UI confirm.
 */

export type DeleteInquiryMessageResult =
  | { ok: true; deleted: boolean }
  | { ok: false; error: string };

export async function deleteInquiryMessage(
  messageId: string,
): Promise<DeleteInquiryMessageResult> {
  if (!messageId) return { ok: false, error: "Missing message id." };

  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("inquiry_messages")
    .delete({ count: "exact" })
    .eq("id", messageId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/orgnz/inquiries");
  revalidatePath("/orgnz");
  return { ok: true, deleted: (count ?? 0) > 0 };
}
