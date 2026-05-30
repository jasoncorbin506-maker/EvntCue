"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";

/**
 * Organizer-side send of an inquiry message. Mirrors the vndr-side action
 * with sender_role='orgnz' + the orgnz tenant resolved from
 * getCurrentOrganizer. RLS gates the insert against bi.buyer_tenant_id +
 * bi.buyer_role match (mig 059 + 061).
 */

const MAX_BODY = 4000;

export type SendInquiryMessageInput = {
  inquiryId: string;
  body: string;
};

export type SendInquiryMessageResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendInquiryMessage(
  input: SendInquiryMessageInput,
): Promise<SendInquiryMessageResult> {
  if (!input.inquiryId) return { ok: false, error: "Missing inquiry id." };
  const body = input.body.trim();
  if (!body) return { ok: false, error: "Message can't be empty." };
  if (body.length > MAX_BODY) {
    return { ok: false, error: `Message too long (${MAX_BODY} max).` };
  }

  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiry_messages")
    .insert({
      inquiry_table: "inquiries",
      inquiry_id: input.inquiryId,
      sender_user_id: organizer.userId,
      sender_tenant_id: organizer.tenantId,
      sender_role: "orgnz",
      body,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message ??
        "Send failed — inquiry may not be yours or has been removed.",
    };
  }
  revalidatePath("/orgnz/inquiries");
  revalidatePath("/orgnz");
  return { ok: true, id: data.id as string };
}
