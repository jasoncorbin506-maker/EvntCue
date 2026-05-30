"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCaterer } from "@/lib/catr/current-caterer";

/**
 * Caterer marks all unread buyer-side messages on an inquiry as read. Buyer
 * messages are sender_role IN ('orgnz','venue'); the caterer's own sent
 * messages stay untouched. RLS's im_update recipient branch already admits
 * this (it keys on inquiry.recipient_tenant_id, role-agnostic on the recipient
 * side) — no migration was needed for mark-read. Called on thread mount.
 */

export type MarkInquiryMessagesReadResult =
  | { ok: true; updated: number }
  | { ok: false; error: string };

export async function markInquiryMessagesRead(
  inquiryId: string,
): Promise<MarkInquiryMessagesReadResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("inquiry_messages")
    .update({ read_at: new Date().toISOString() }, { count: "exact" })
    .eq("inquiry_table", "inquiries")
    .eq("inquiry_id", inquiryId)
    .in("sender_role", ["orgnz", "venue"])
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/catr/inquiries");
  revalidatePath("/catr");
  return { ok: true, updated: count ?? 0 };
}
