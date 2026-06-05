"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logInquiryOffer, type InquiryOfferRole } from "@/lib/inquiries/offers";
import {
  INQUIRY_OFFER_BUYER_CAUSES,
  type InquiryOfferCause,
} from "@/lib/labels/inquiry-offer";

/**
 * Negotiation Layer B — buyer rejects the seller's standing counter/quote.
 * Closes the inquiry and logs a 'decline' row (offered_by_role = the buyer's
 * role) with a required reason, so the seller sees why. Mirrors the vendor Pass.
 *
 * Plain UPDATE (not the deposit RPC) — `inq_update` RLS already scopes writes to
 * the buyer (buyer_tenant_id ∈ their tenants), and `status` is not one of the
 * deposit columns locked by migration 083. The .in() guard rejects anything not
 * in a respondable ('quoted') state. The mig-091 CHECK requires a cause on
 * decline, which the buyer reason picker enforces client-side too.
 */

export type RejectCounterInput = {
  inquiryId: string;
  cause: InquiryOfferCause;
  note?: string | null;
};

export type RejectCounterResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function rejectCounter(
  input: RejectCounterInput,
): Promise<RejectCounterResult> {
  if (!input.inquiryId) return { ok: false, error: "Missing inquiry id." };
  if (!INQUIRY_OFFER_BUYER_CAUSES.includes(input.cause)) {
    return { ok: false, error: "Pick a reason for passing." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .update({ status: "closed" })
    .eq("id", input.inquiryId)
    .in("status", ["quoted"])
    .select("id, buyer_tenant_id, buyer_role")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message ??
        "Couldn't reject — the offer may have changed or already closed.",
    };
  }

  await logInquiryOffer(supabase, {
    inquiryId: input.inquiryId,
    offeredByTenantId: data.buyer_tenant_id as string,
    offeredByRole: (data.buyer_role as InquiryOfferRole | null) ?? "orgnz",
    action: "decline",
    cause: input.cause,
    note: input.note ?? null,
  });

  revalidatePath("/orgnz/inquiries");
  revalidatePath("/orgnz");
  return { ok: true, id: data.id as string };
}
