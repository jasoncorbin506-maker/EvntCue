"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Buyer accepts a seller's quote and funds the deposit — the Model C moment a
 * bare inquiry becomes a cash-backed "Confirmed hold." This is what makes a
 * lead *qualified*: the date isn't held until money is on file.
 *
 *   fund_inquiry_deposit:  quoted (deposit none) → penciled (deposit funded)
 *     + deposit_amount_cents (25% of quote), deposit_funded_at = now,
 *       hold_expires_at = +14d
 *
 * The write goes through the SECURITY DEFINER fn `fund_inquiry_deposit`
 * (migration 083 / R2 / PL #101) — the SOLE writer of the four deposit columns,
 * which `authenticated` can no longer UPDATE directly. That closes the prior
 * self-serve funded-flip bypass (a raw PostgREST UPDATE flipping 'funded' with
 * no charge). The fn re-checks buyer ownership + state server-side, so the
 * pre-read below is purely for friendly UX errors, not a security gate.
 *
 * STUB MONEY — pre-Stripe. The fn stamps funded with no charge; when Stripe
 * Connect lands it gains a payment_intent.succeeded gate (the bypass surface is
 * already closed, so that's an additive change inside the fn).
 *
 * Deposit fraction (25%) + hold window (14d) live in the fn now — single source
 * of truth — until venu-set deposit terms ship (PARKING_LOT #45).
 */

export type FundDepositResult =
  | { ok: true; id: string; depositAmountCents: number }
  | { ok: false; error: string };

export async function acceptAndFundDeposit(
  inquiryId: string,
): Promise<FundDepositResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

  const supabase = await createClient();

  // Friendly pre-checks (UX only — the fn re-validates server-side). RLS
  // (inq_select) scopes this read to the buyer's own inquiries.
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

  // The actual flip — definer fn is the only path that may write the deposit
  // columns. Returns one row: { id, deposit_amount_cents }.
  const { data, error } = await supabase
    .rpc("fund_inquiry_deposit", { p_inquiry_id: inquiryId })
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Couldn't fund the deposit — please try again.",
    };
  }

  revalidatePath("/orgnz/inquiries");
  revalidatePath("/orgnz");
  return {
    ok: true,
    id: (data as { id: string }).id,
    depositAmountCents: (data as { deposit_amount_cents: number }).deposit_amount_cents,
  };
}
