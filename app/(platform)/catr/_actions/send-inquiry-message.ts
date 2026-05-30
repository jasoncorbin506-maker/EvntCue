"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCaterer } from "@/lib/catr/current-caterer";

/**
 * Caterer sends a message into an inquiry thread. Mirrors the vndr action;
 * sender_role='catr' is admitted by im_insert as of migration 071 (the
 * seller-side branch widened from 'vndr' to IN ('vndr','catr','venu') on the
 * same recipient_tenant_id = sender_tenant_id predicate). RLS still enforces:
 *   - sender_user_id = auth.uid()
 *   - sender_tenant_id IN current_user_tenants()
 *   - sender_role='catr' requires inquiry.recipient_tenant_id = sender_tenant_id
 *
 * App-layer validation: body trim + length 1..4000 (also CHECK-constrained).
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

  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };

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
      sender_tenant_id: caterer.tenantId,
      sender_role: "catr",
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
  revalidatePath("/catr/inquiries");
  revalidatePath("/catr");
  return { ok: true, id: data.id as string };
}
