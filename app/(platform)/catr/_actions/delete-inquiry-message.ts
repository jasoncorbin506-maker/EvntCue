"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCaterer } from "@/lib/catr/current-caterer";

/**
 * Caterer hard-deletes their OWN message from an inquiry thread. RLS's
 * im_delete policy gates this to sender_user_id = auth.uid() — the counter-
 * party can't delete the caterer's messages. Hard-delete with a 2-step UI
 * confirm, matching the vndr/orgnz pattern.
 */

export type DeleteInquiryMessageResult =
  | { ok: true; deleted: boolean }
  | { ok: false; error: string };

export async function deleteInquiryMessage(
  messageId: string,
): Promise<DeleteInquiryMessageResult> {
  if (!messageId) return { ok: false, error: "Missing message id." };

  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("inquiry_messages")
    .delete({ count: "exact" })
    .eq("id", messageId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/catr/inquiries");
  revalidatePath("/catr");
  return { ok: true, deleted: (count ?? 0) > 0 };
}
