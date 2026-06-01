/**
 * Deposit / escrow-state display labels (Model C).
 *
 * The deposit lifecycle rides ALONGSIDE the seven-state inquiry funnel
 * (lib/labels/inquiry-status.ts) — it is an orthogonal dimension, not a funnel
 * stage. Its whole job is to let a seller inbox tell a cash-backed Confirmed
 * hold from a bare inquiry (the Model C "qualified leads are unmistakable"
 * promise). DB enum: `inquiry_deposit_status` (migration 081).
 *
 * Stub-money pre-Stripe: `funded` is set by the buyer's "Accept & fund deposit"
 * action without real money moving. When Stripe Connect lands, the funded
 * transition moves behind a payment-gated SECURITY DEFINER fn (see migration
 * 081 header).
 *
 * EN/ES parity per Lock 14b (mirrors the inquiry-status label phasing).
 */

import type { Locale } from "@/i18n/locale";

export type DepositStatus =
  | "none"
  | "funding"
  | "funded"
  | "released"
  | "refunded";

const DEPOSIT_LABELS_EN: Record<DepositStatus, string> = {
  none: "Inquiry",
  funding: "Funding…",
  funded: "Confirmed hold",
  released: "Released",
  refunded: "Refunded",
};

const DEPOSIT_LABELS_ES: Record<DepositStatus, string> = {
  none: "Consulta",
  funding: "Procesando…",
  funded: "Reserva confirmada",
  released: "Liberado",
  refunded: "Reembolsado",
};

export function depositStatusLabel(status: string, locale: Locale = "en"): string {
  const table = locale === "es" ? DEPOSIT_LABELS_ES : DEPOSIT_LABELS_EN;
  return (
    table[status as DepositStatus] ??
    DEPOSIT_LABELS_EN[status as DepositStatus] ??
    status
  );
}

/**
 * A funded deposit = a cash-backed "Confirmed hold." This is the single
 * predicate the seller inbox + buyer sheet branch on to render the two-tier
 * distinction. (`released` keeps the hold visually confirmed post-event; only
 * `none`/`funding`/`refunded` read as not-yet-held.)
 */
export function isConfirmedHold(status: string | null | undefined): boolean {
  return status === "funded" || status === "released";
}
