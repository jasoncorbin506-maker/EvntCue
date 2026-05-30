"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * V-2c Session 1 (migration 058): vendor sends a message into an inquiry
 * thread. RLS enforces:
 *   - sender_user_id = auth.uid()
 *   - sender_tenant_id IN current_user_tenants()
 *   - sender_role='vndr' requires inquiry.recipient_tenant_id = sender_tenant_id
 *
 * App-layer validation: body trim + length 1..4000. Body length is also
 * CHECK-constrained in the DB; the app check gives a clearer error.
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

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("inquiry_messages")
    .insert({
      inquiry_table: "inquiries",
      inquiry_id: input.inquiryId,
      sender_user_id: user.id,
      sender_tenant_id: vendor.tenantId,
      sender_role: "vndr",
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
  revalidatePath("/vndr/inquiries");
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
