"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logInquiryOffer, type InquiryOfferRole } from "@/lib/inquiries/offers";
import {
  INQUIRY_OFFER_CAUSES,
  type InquiryOfferCause,
} from "@/lib/labels/inquiry-offer";

/**
 * Negotiation Layer B — vendor counter-with-cause. Proposes a different price
 * than the buyer's offer, with a required reason (the cause vocabulary doubles
 * as the prepopulated chips) and an optional note. Sets the quote + transitions
 * to 'quoted', and logs a 'counter' row so the buyer sees the number AND the
 * why. RLS scopes the write to the recipient vendor.
 *
 * One counter each way is enforced for the *buyer's* turn in Layer C; a vendor
 * reaches this only from inquiry/reviewing (their first response).
 */

export type CounterInquiryInput = {
  inquiryId: string;
  priceCents: number;
  cause: InquiryOfferCause;
  note?: string | null;
};

export type CounterInquiryResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function counterInquiry(
  input: CounterInquiryInput,
): Promise<CounterInquiryResult> {
  if (!input.inquiryId) return { ok: false, error: "Missing inquiry id." };
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
    return { ok: false, error: "Counter must be 0 or more cents." };
  }
  if (input.priceCents > 100_000_000) {
    return { ok: false, error: "Counter too high — check the amount." };
  }
  if (!INQUIRY_OFFER_CAUSES.includes(input.cause)) {
    return { ok: false, error: "Pick a reason for your counter." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .update({
      proposed_price_cents: input.priceCents,
      responded_at: new Date().toISOString(),
      status: "quoted",
    })
    .eq("id", input.inquiryId)
    .in("status", ["inquiry", "reviewing"])
    .select("id, recipient_tenant_id, recipient_type")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message ??
        "Couldn't counter — the inquiry may already be answered or in a terminal state.",
    };
  }

  await logInquiryOffer(supabase, {
    inquiryId: input.inquiryId,
    offeredByTenantId: data.recipient_tenant_id as string,
    offeredByRole: (data.recipient_type as InquiryOfferRole | null) ?? "vndr",
    action: "counter",
    priceCents: input.priceCents,
    cause: input.cause,
    note: input.note ?? null,
  });

  revalidatePath("/vndr/inquiries");
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
