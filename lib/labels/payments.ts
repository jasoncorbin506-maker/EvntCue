/**
 * lib/labels/payments.ts
 *
 * Canonical pre-Stripe "payments are coming" copy. Single source of truth so
 * every portal's payment placeholder speaks with one voice instead of the
 * scattered ad-hoc strings we had (a generic "Coming soon" on vndr/money, a
 * "Stripe Connect setup lands in Phase 4" toast on orgnz, nothing on catr).
 *
 * Same Lock 15 precedent as ./commission-flows.ts: internal terms must not leak
 * to the UI. "Phase 4" is roadmap jargon — it means nothing to a vendor and
 * reads as a half-built product. User-facing copy says "coming soon" / "when
 * payments go live"; the phase number stays in code comments and Backstage.
 *
 * Two registers, because the two sides of a payment read differently:
 *   - SELLER (vndr / venu / catr) — they *receive*. Framed as "connect payouts."
 *   - BUYER  (orgnz)              — they *pay*. Framed as "secure payments."
 *
 * EN only for now, matching the surrounding stub surfaces (none are i18n-wired
 * yet). When these surfaces gain real payment flows + next-intl catalogs, the
 * ES parity pass (Lock 9) lands with them.
 */

/** Seller-side: vndr / venu / catr money + payout surfaces. */
export const PAYOUTS_COMING_SOON = {
  /** Short status chip. */
  pill: "Coming soon",
  /** Display-font heading. */
  title: "Connect payouts",
  /** One-paragraph body. */
  body:
    "When payments go live, connect a payout account to receive deposits and " +
    "balances straight to your bank — with every platform fee shown up front, " +
    "no surprises.",
  /** Disabled-affordance helper line. */
  cta: "Available when payments launch",
} as const;

/** Buyer-side: orgnz budget / contribution / payment-setup surfaces. */
export const PAYMENTS_COMING_SOON = {
  pill: "Coming soon",
  title: "Secure payments",
  body:
    "Deposits, receipts, and refunds run through Stripe — coming soon. " +
    "You'll be able to fund a deposit and pay balances securely in-app.",
  /** Toast shown when a buyer taps a payment affordance early. */
  toast: "Secure payments — deposits, receipts, and refunds — are <em>coming soon</em>.",
} as const;
