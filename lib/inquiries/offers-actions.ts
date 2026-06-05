"use server";

import { getInquiryOffers, type InquiryOfferRow } from "@/lib/inquiries/offers";

/**
 * Client-callable loader for the inquiry-offer ledger (negotiation Layer B).
 * Thin "use server" wrapper over the RLS-scoped read in `offers.ts` so the
 * shared <OfferLedger> client component can fetch on mount from either portal —
 * `inq_offers_participant_select` already restricts rows to the inquiry's two
 * participant tenants, so one action serves buyer and seller without forking.
 */
export async function loadInquiryOffers(
  inquiryId: string,
): Promise<InquiryOfferRow[]> {
  if (!inquiryId) return [];
  return getInquiryOffers(inquiryId);
}
