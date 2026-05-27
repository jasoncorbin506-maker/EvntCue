"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";

/**
 * Organizer-side mark-read for an inquiry thread. Flips read_at on
 * vendor-sent messages (sender_role='vndr'); the organizer's own sent
 * messages stay write-only-to-self. RLS's im_update (mig 061) gates
 * the UPDATE to the counter-party.
 */

export type MarkInquiryMessagesReadResult =
  | { ok: true; updated: number }
  | { ok: false; error: string };

export async function markInquiryMessagesRead(
  inquiryId: string,
): Promise<MarkInquiryMessagesReadResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("inquiry_messages")
    .update({ read_at: new Date().toISOString() }, { count: "exact" })
    .eq("inquiry_table", "booking_inquiries")
    .eq("inquiry_id", inquiryId)
    .eq("sender_role", "vndr")
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/orgnz/inquiries");
  revalidatePath("/orgnz");
  return { ok: true, updated: count ?? 0 };
}
