/**
 * lib/labels/commission-flows.ts
 *
 * DB enum → UI display string translation for `commission_flows.type` per §34.
 * This is the canonical Lock 15 precedent (locked 2026-05-13). See `./README.md`.
 *
 * UI imports `commissionFlowLabel[row.type]` — never the raw enum value.
 *
 * The translation layer exists because words like "kickback" are correct in
 * venue-industry shop-talk but read as bribery to a first-time customer.
 * Schema names leaking to UI = brand damage. Same risk for any DB term that's
 * correct internally but reads wrong externally.
 */

export type CommissionFlowType =
  | "venue_in_house"
  | "venue_fb_surcharge"
  | "venue_kickback"
  | "venue_referral"
  | "vndr_referral"
  | "co_plnr_split"
  | "platform_fee"
  | "platform_marketplace_fee"
  | "virtual_attendance_fee";

/**
 * Short UI label (chips, table headers, breakdown rows).
 */
export const commissionFlowLabel: Record<CommissionFlowType, string> = {
  venue_in_house:           "In-house fee",
  venue_fb_surcharge:       "F&B surcharge",
  venue_kickback:           "Referral fee", // Lock 15: NEVER surface "kickback" in UI
  venue_referral:           "Plnr sourcing fee",
  vndr_referral:            "Vndr referral",
  co_plnr_split:            "Co-Plnr split",
  platform_fee:             "Platform fee",
  platform_marketplace_fee: "Marketplace fee",
  virtual_attendance_fee:   "Virtual attendance fee",
};

/**
 * Longer human-readable expansion (tooltips, configuration sheets, help copy).
 * When in doubt, use the short `commissionFlowLabel` instead.
 */
export const commissionFlowDescription: Record<CommissionFlowType, string> = {
  venue_in_house:
    "Fee the Venu charges directly to the Orgnz (room rental, setup, in-house bar).",
  venue_fb_surcharge:
    "Food & beverage surcharge the Venu collects when an outside Catr is used.",
  venue_kickback:
    "Referral compensation the Venu receives from a preferred outside Vndr for the introduction.",
  venue_referral:
    "Sourcing fee the Venu pays to a Plnr who brought the booking.",
  vndr_referral:
    "Referral fee paid to a Vndr for a successful introduction.",
  co_plnr_split:
    "Revenue share between two Plnrs collaborating on the same event.",
  platform_fee:
    "EvntCue's platform commission on the booking. Rate varies by tier and portal; see data/commission-rates.ts for the canonical v2a matrix. Includes payment processing — Vndrs see one consolidated number, not a Stripe vs platform breakdown.",
  platform_marketplace_fee:
    "Marketplace fee applied to discovery-driven bookings.",
  virtual_attendance_fee:
    "Per-attendee fee for guests joining the event remotely.",
};
