// data/commission-rates.ts
// Lock 25 v2a — 2026-05-24 — see decisions-log/2026-05-24-pricing-model-v2a.md
//
// Five-portal × three-tier pricing matrix. All commission percentages
// INCLUDE payment processing fees (Stripe pass-through is baked in).
// Vendor-facing surfaces display the consolidated rate as ONE number.
// Internal accounting may break out Stripe vs platform via internalBreakdown.

export type PortalKey = "plnr" | "venu" | "catr" | "vndr" | "orgnz";
export type TierKey = "free" | "pro" | "enterprise";

export interface InternalBreakdown {
  stripeProcessing: number; // ~0.025 across the board (Stripe pass-through)
  evntcuePlatform: number; // EvntCue net margin
  marketplaceCommission: number; // For Plnr/Venu Free where the 5% marketplace surcharge applies
}

export interface TierConfig {
  /** Headline rate — what the user sees. INCLUDES processing.
   *  null for tiers where commission doesn't apply (Orgnz) or isn't published (Enterprise). */
  commissionRate: number | null;
  /** Monthly subscription cost in dollars. null for free tiers / sales-led tiers. */
  monthlyPrice: number | null;
  /** Display label for the rate in UI. "Contact us" for sales-led Enterprise. */
  displayLabel: string;
  /** For internal accounting only — NOT surfaced in headline copy.
   *  Approximate breakdown of where the headline rate goes. */
  internalBreakdown: InternalBreakdown | null;
}

export const COMMISSION_RATES: Record<PortalKey, Record<TierKey, TierConfig>> = {
  plnr: {
    free: {
      commissionRate: 0.11,
      monthlyPrice: 0,
      displayLabel: "11%",
      internalBreakdown: { stripeProcessing: 0.025, evntcuePlatform: 0.035, marketplaceCommission: 0.05 },
    },
    pro: {
      commissionRate: 0.05,
      monthlyPrice: 199,
      displayLabel: "5%",
      internalBreakdown: { stripeProcessing: 0.025, evntcuePlatform: 0.025, marketplaceCommission: 0 },
    },
    enterprise: {
      commissionRate: null,
      monthlyPrice: null,
      displayLabel: "Contact us",
      internalBreakdown: null,
    },
  },
  venu: {
    free: {
      commissionRate: 0.11,
      monthlyPrice: 0,
      displayLabel: "11%",
      internalBreakdown: { stripeProcessing: 0.025, evntcuePlatform: 0.035, marketplaceCommission: 0.05 },
    },
    pro: {
      commissionRate: 0.05,
      monthlyPrice: 199,
      displayLabel: "5%",
      internalBreakdown: { stripeProcessing: 0.025, evntcuePlatform: 0.025, marketplaceCommission: 0 },
    },
    enterprise: {
      commissionRate: null,
      monthlyPrice: null,
      displayLabel: "Contact us",
      internalBreakdown: null,
    },
  },
  catr: {
    free: {
      commissionRate: 0.075,
      monthlyPrice: 0,
      displayLabel: "7.5%",
      internalBreakdown: { stripeProcessing: 0.025, evntcuePlatform: 0.05, marketplaceCommission: 0 },
    },
    pro: {
      commissionRate: 0.06,
      monthlyPrice: 129,
      displayLabel: "6%",
      internalBreakdown: { stripeProcessing: 0.025, evntcuePlatform: 0.035, marketplaceCommission: 0 },
    },
    enterprise: {
      commissionRate: null,
      monthlyPrice: null,
      displayLabel: "Contact us",
      internalBreakdown: null,
    },
  },
  vndr: {
    free: {
      commissionRate: 0.075,
      monthlyPrice: 0,
      displayLabel: "7.5%",
      internalBreakdown: { stripeProcessing: 0.025, evntcuePlatform: 0.05, marketplaceCommission: 0 },
    },
    pro: {
      commissionRate: 0.06,
      monthlyPrice: 129,
      displayLabel: "6%",
      internalBreakdown: { stripeProcessing: 0.025, evntcuePlatform: 0.035, marketplaceCommission: 0 },
    },
    enterprise: {
      commissionRate: null,
      monthlyPrice: null,
      displayLabel: "Contact us",
      internalBreakdown: null,
    },
  },
  orgnz: {
    free: {
      commissionRate: 0,
      monthlyPrice: 0,
      displayLabel: "0%",
      internalBreakdown: null,
    },
    pro: {
      commissionRate: 0,
      monthlyPrice: 39,
      displayLabel: "0%",
      internalBreakdown: null,
    },
    enterprise: {
      commissionRate: null,
      monthlyPrice: null,
      displayLabel: "Contact us",
      internalBreakdown: null,
    },
  },
};

/**
 * Returns the headline rate string ("6%") or "Contact us" for Enterprise.
 * Use this everywhere a rate is displayed.
 */
export function getDisplayRate(portal: PortalKey, tier: TierKey): string {
  return COMMISSION_RATES[portal][tier].displayLabel;
}

/**
 * Returns the percentage the vendor retains after commission.
 * null for sales-led Enterprise tiers (no published rate).
 * Use this for "vendor keeps" framing (avoid the confusing "X% to vendor" phrasing).
 */
export function getVendorKeepsRate(portal: PortalKey, tier: TierKey): number | null {
  const rate = COMMISSION_RATES[portal][tier].commissionRate;
  return rate === null ? null : 1 - rate;
}
