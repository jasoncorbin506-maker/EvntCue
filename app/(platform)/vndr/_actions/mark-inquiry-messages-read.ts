"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * V-2c Session 1: vendor marks all unread buyer-side messages on an
 * inquiry as read. Buyer messages are sender_role IN ('orgnz', 'venue')
 * per mig 061's widened sender_role enum — the vendor's own sent
 * messages stay write-only-to-self regardless.
 *
 * Typically called when the vendor opens an InquiryDetailSheet for the
 * first time, OR when the bottom-nav badge is tapped + the page loads.
 *
 * RLS gates the UPDATE: only the counter-party (this vendor, for buyer-
 * sent messages) can flip read_at. App-layer SET clause is restricted
 * to read_at — even if RLS allowed broader UPDATE, this action wouldn't
 * touch other columns.
 */

export type MarkInquiryMessagesReadResult =
  | { ok: true; updated: number }
  | { ok: false; error: string };

export async function markInquiryMessagesRead(
  inquiryId: string,
): Promise<MarkInquiryMessagesReadResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("inquiry_messages")
    .update({ read_at: new Date().toISOString() }, { count: "exact" })
    .eq("inquiry_table", "inquiries")
    .eq("inquiry_id", inquiryId)
    .in("sender_role", ["orgnz", "venue"])
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vndr/inquiries");
  revalidatePath("/vndr");
  return { ok: true, updated: count ?? 0 };
}
