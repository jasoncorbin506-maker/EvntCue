"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Buyer accepts a seller's quote and funds the deposit — the Model C moment a
 * bare inquiry becomes a cash-backed "Confirmed hold." This is what makes a
 * lead *qualified*: the date isn't held until money is on file.
 *
 *   acceptAndFundDeposit:  quoted (deposit none) → penciled (deposit funded)
 *     + deposit_amount_cents, deposit_funded_at = now, hold_expires_at = +14d
 *
 * STUB MONEY — pre-Stripe. No charge happens; this only stamps the deposit
 * state via the buyer branch of the inq_update RLS policy. When Stripe Connect
 * lands, this MUST move to a SECURITY DEFINER fn gated on a verified payment
 * intent (a self-serve UPDATE that flips 'funded' with no charge is a bypass —
 * see migration 081 header). The `.eq` source guards keep the transition legal.
 *
 * Deposit amount is a platform-default fraction of the quote until venu-set
 * deposit terms ship (the payment-flows config sheet, PARKING_LOT #45).
 */

const DEPOSIT_FRACTION = 0.25;
const HOLD_DAYS = 14;

export type FundDepositResult =
  | { ok: true; id: string; depositAmountCents: number }
  | { ok: false; error: string };

export async function acceptAndFundDeposit(
  inquiryId: string,
): Promise<FundDepositResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

  const supabase = await createClient();

  // Read the quote to size the deposit. RLS (inq_select) scopes this to the
  // buyer's own inquiries.
  const { data: row, error: readErr } = await supabase
    .from("inquiries")
    .select("proposed_price_cents, status, deposit_status")
    .eq("id", inquiryId)
    .maybeSingle();

  if (readErr || !row) {
    return { ok: false, error: readErr?.message ?? "Inquiry not found." };
  }
  if (row.status !== "quoted") {
    return { ok: false, error: "You can only fund a deposit on a quoted inquiry." };
  }
  if (row.deposit_status !== "none") {
    return { ok: false, error: "This inquiry already has a deposit on file." };
  }
  const priceCents = row.proposed_price_cents as number | null;
  if (priceCents == null || priceCents <= 0) {
    return { ok: false, error: "The seller hasn't set a quote price yet." };
  }

  const depositAmountCents = Math.round(priceCents * DEPOSIT_FRACTION);
  const now = new Date();
  const holdExpiresAt = new Date(now.getTime() + HOLD_DAYS * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("inquiries")
    .update({
      status: "penciled",
      deposit_status: "funded",
      deposit_amount_cents: depositAmountCents,
      deposit_funded_at: now.toISOString(),
      hold_expires_at: holdExpiresAt,
    })
    .eq("id", inquiryId)
    .eq("status", "quoted")
    .eq("deposit_status", "none")
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Couldn't fund the deposit — please try again.",
    };
  }

  revalidatePath("/orgnz/inquiries");
  revalidatePath("/orgnz");
  return { ok: true, id: data.id as string, depositAmountCents };
}
