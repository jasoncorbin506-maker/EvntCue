"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * Stage 3 server action. Writes the Stage-3 capacity/pricing columns on
 * vendors:
 *   - starting_price_cents (INT — log-scale slider $500-$25K)
 *   - concurrent_max       (INT — 1-6, hard cap matches DB CHECK)
 *   - pricing_model        ('package' | 'hourly')
 *   - booking_mode         ('instant_book' | 'inquiry_first')
 *   - referral_rate_pct    (NUMERIC 0-20, CHECK enforces in DB)
 *
 * Inputs are validated against the canonical enum values + numeric ranges
 * before the UPDATE. The DB-side CHECK constraint (vendors_referral_rate_bounds
 * 0-20) is the second-line defense.
 *
 * RLS-scoped via createClient(). vendors_update policy lets the owning
 * tenant update their own row.
 */

const PRICING_MODELS = ["package", "hourly"] as const;
type PricingModel = (typeof PRICING_MODELS)[number];
const BOOKING_MODES = ["instant_book", "inquiry_first"] as const;
type BookingMode = (typeof BOOKING_MODES)[number];

const isPricingModel = (v: string): v is PricingModel =>
  (PRICING_MODELS as readonly string[]).includes(v);
const isBookingMode = (v: string): v is BookingMode =>
  (BOOKING_MODES as readonly string[]).includes(v);

export type SaveStage3Result =
  | { ok: true }
  | { ok: false; error: string };

export async function saveStage3Action(input: {
  startingPriceCents: number;
  concurrentMax: number;
  pricingModel: string;
  bookingMode: string;
  referralRatePct: number;
}): Promise<SaveStage3Result> {
  if (
    !Number.isInteger(input.startingPriceCents) ||
    input.startingPriceCents < 0 ||
    input.startingPriceCents > 10_000_000 // $100K ceiling; slider tops at $25K
  ) {
    return { ok: false, error: "Starting price is out of range." };
  }
  if (
    !Number.isInteger(input.concurrentMax) ||
    input.concurrentMax < 1 ||
    input.concurrentMax > 6
  ) {
    return { ok: false, error: "Concurrent events must be between 1 and 6." };
  }
  if (!isPricingModel(input.pricingModel)) {
    return { ok: false, error: "Pick a pricing model to continue." };
  }
  if (!isBookingMode(input.bookingMode)) {
    return { ok: false, error: "Pick a booking flow to continue." };
  }
  if (
    !Number.isFinite(input.referralRatePct) ||
    input.referralRatePct < 0 ||
    input.referralRatePct > 20
  ) {
    return {
      ok: false,
      error: "Referral rate must be between 0% and 20%.",
    };
  }

  const vendor = await getCurrentVendor();
  if (!vendor) {
    return {
      ok: false,
      error: "Your session expired. Sign in again to continue.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .update({
      starting_price_cents: input.startingPriceCents,
      concurrent_max: input.concurrentMax,
      pricing_model: input.pricingModel,
      booking_mode: input.bookingMode,
      referral_rate_pct: input.referralRatePct,
    })
    .eq("id", vendor.id);

  if (error) {
    return { ok: false, error: "Could not save right now. Try again." };
  }

  return { ok: true };
}
