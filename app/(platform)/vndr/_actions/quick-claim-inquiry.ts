"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logInquiryOffer, type InquiryOfferRole } from "@/lib/inquiries/offers";

/**
 * Negotiation Layer B — vendor Quick Claim. Accepts the buyer's standing offer
 * (inquiries.initial_offer_cents) as the quote in one tap: same transition as a
 * normal quote (→ 'quoted' at that price), plus a 'claim' row on the offer
 * ledger so the thread shows the buyer's number was taken as-is. RLS scopes the
 * write to the recipient vendor; the .in() guard rejects already-answered rows.
 *
 * No offer on the inquiry → there's nothing to claim; the UI sends a quote
 * instead (this returns an error if called anyway).
 */

export type QuickClaimResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function quickClaimInquiry(
  inquiryId: string,
): Promise<QuickClaimResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

  const supabase = await createClient();

  const { data: inq } = await supabase
    .from("inquiries")
    .select("id, initial_offer_cents, recipient_tenant_id, recipient_type, status")
    .eq("id", inquiryId)
    .maybeSingle();
  if (!inq) return { ok: false, error: "Inquiry not found." };

  const offer = inq.initial_offer_cents as number | null;
  if (offer == null || offer <= 0) {
    return {
      ok: false,
      error: "There's no buyer offer to claim — send a quote instead.",
    };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .update({
      proposed_price_cents: offer,
      responded_at: new Date().toISOString(),
      status: "quoted",
    })
    .eq("id", inquiryId)
    .in("status", ["inquiry", "reviewing"])
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message ??
        "Couldn't claim — the inquiry may already be answered or in a terminal state.",
    };
  }

  // Ledger row — best-effort; the status transition above is the source of truth.
  await logInquiryOffer(supabase, {
    inquiryId,
    offeredByTenantId: inq.recipient_tenant_id as string,
    offeredByRole: (inq.recipient_type as InquiryOfferRole | null) ?? "vndr",
    action: "claim",
    priceCents: offer,
  });

  revalidatePath("/vndr/inquiries");
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
