import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CurrentVendor } from "@/lib/vndr/current-vendor";
import { VNDR_RESPONSE_SLA_HOURS } from "@/lib/vndr/oldest-unresponded-inquiry";
import { getVendorProfile, getVendorPhotos } from "@/lib/vndr/profile";
import { getReviewAggregateForTenant } from "@/lib/reviews/event-reviews";

/**
 * Vendor trust score — weighted average of 4 sub-metrics, computed on-the-fly
 * per V-2b brief §5. Materialization into a `vendor_trust_snapshots` table
 * is a future denormalization once vendor count grows + the formula stabilizes.
 *
 * Per Jason's lock 2026-05-24, weights are:
 *   - Review average:     40%
 *   - Response rate:      30%
 *   - Completion rate:    20%
 *   - Profile completeness: 10%
 *
 * Each sub-metric is 0–100. Final score is rounded to integer.
 *
 * Lookback windows:
 *   - Response rate: last 30 days of inquiries that had at least the SLA
 *     window to be responded to (filters out brand-new inquiries that aren't
 *     yet "missed")
 *   - Completion rate: last 90 days of bookings that have reached a terminal
 *     state (completed | cancelled)
 *   - Review average: not implemented in V-2b (no reviews schema yet) —
 *     returns 0 sub-metric until V-2c review collection flow ships
 *   - Profile completeness: snapshot of the vendor's current profile fields
 *
 * Empty-state behavior: a brand-new vendor with no inquiries / no bookings /
 * no reviews / partially-filled profile returns a low score (mostly from
 * profile completeness). This is honest — a vendor with no track record
 * hasn't earned trust yet. Tier label ("Building" / "Strong" / etc.) gives
 * the empty state a non-judgemental presentation.
 */

export const TRUST_WEIGHTS = {
  reviews: 0.4,
  response: 0.3,
  completion: 0.2,
  profile: 0.1,
} as const;

export type TrustSubMetrics = {
  responseRate: number;
  completionRate: number;
  reviewAverage: number;
  profileCompleteness: number;
};

export type TrustScore = {
  total: number;
  tier: "building" | "developing" | "strong" | "excellent";
  subMetrics: TrustSubMetrics;
  /**
   * Number of profile fields still empty (out of the 12-field completeness
   * check). V-2b smoke-fix (session 23) — surfaces under the Profile bar
   * on Home as "Add N more fields to your Profile tab" call-to-action.
   * 0 means profile is fully filled.
   */
  profileMissingCount: number;
};

function tierFor(score: number): TrustScore["tier"] {
  if (score >= 85) return "excellent";
  if (score >= 70) return "strong";
  if (score >= 50) return "developing";
  return "building";
}

/**
 * % of profile fields filled. Session B (2026-05-25) expands beyond the
 * coarse session-A 4-field check to use the full Profile-tab field set:
 *   - displayName, primaryCategory, primarySubType (onboarding-set)
 *   - foundingStory (bio), yearsInBusiness
 *   - city, serviceZips (at least 1)
 *   - contactEmail, contactPhone
 *   - websiteUrl
 *   - startingPriceCents
 *   - At least 1 portfolio photo (migration 056)
 *
 * 12 fields × equal weight. Vendor with everything filled scores 100;
 * brand-new vendor with just displayName scores ~8.
 */
async function computeProfileCompleteness(
  vendor: CurrentVendor,
): Promise<{ score: number; missingCount: number }> {
  const [profile, photos] = await Promise.all([
    getVendorProfile(vendor.tenantId),
    getVendorPhotos(vendor.tenantId),
  ]);

  let filled = 0;
  const total = 12;

  if (vendor.displayName && vendor.displayName.trim().length > 0) filled++;
  if (vendor.primaryCategory) filled++;
  if (vendor.primarySubType) filled++;

  if (profile) {
    if (profile.foundingStory && profile.foundingStory.trim().length >= 20) filled++;
    if (profile.yearsInBusiness !== null && profile.yearsInBusiness > 0) filled++;
    if (profile.city && profile.city.trim().length > 0) filled++;
    if (profile.serviceZips.length > 0) filled++;
    if (profile.contactEmail && profile.contactEmail.trim().length > 0) filled++;
    if (profile.contactPhone && profile.contactPhone.trim().length > 0) filled++;
    if (profile.websiteUrl && profile.websiteUrl.trim().length > 0) filled++;
    if (profile.startingPriceCents !== null && profile.startingPriceCents > 0) filled++;
  }

  if (photos.length > 0) filled++;

  return {
    score: Math.round((filled / total) * 100),
    missingCount: total - filled,
  };
}

/**
 * Response rate over last 30 days. Numerator = inquiries responded to within
 * SLA; denominator = inquiries that had at least SLA hours to be responded
 * to (excludes brand-new inquiries still inside their grace window — those
 * aren't yet "missed").
 */
async function computeResponseRate(vendorTenantId: string): Promise<number> {
  const supabase = await createClient();
  const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();
  const slaCutoffMs = Date.now() - VNDR_RESPONSE_SLA_HOURS * 60 * 60 * 1000;
  const slaCutoffIso = new Date(slaCutoffMs).toISOString();

  const { data } = await supabase
    .from("booking_inquiries")
    .select("created_at, responded_at")
    .eq("vndr_tenant_id", vendorTenantId)
    .gte("created_at", cutoffIso)
    .lte("created_at", slaCutoffIso);
  const rows = data ?? [];
  if (rows.length === 0) return 0;

  let responded = 0;
  for (const r of rows) {
    const row = r as Record<string, unknown>;
    const respondedAt = row.responded_at as string | null;
    if (!respondedAt) continue;
    const createdMs = new Date(row.created_at as string).getTime();
    const respondedMs = new Date(respondedAt).getTime();
    if (respondedMs - createdMs <= VNDR_RESPONSE_SLA_HOURS * 60 * 60 * 1000) {
      responded++;
    }
  }
  return Math.round((responded / rows.length) * 100);
}

/**
 * Completion rate over last 90 days. Numerator = bookings that reached
 * 'completed'; denominator = bookings that reached a terminal state
 * ('completed' | 'cancelled'). Bookings still in 'confirmed' don't count
 * yet (they haven't yet had a chance to complete or fall apart).
 */
async function computeCompletionRate(vendorTenantId: string): Promise<number> {
  const supabase = await createClient();
  const cutoffMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();

  const { data } = await supabase
    .from("bookings")
    .select("status")
    .eq("vndr_tenant_id", vendorTenantId)
    .gte("created_at", cutoffIso)
    .in("status", ["completed", "cancelled"]);
  const rows = data ?? [];
  if (rows.length === 0) return 0;

  const completed = rows.filter(
    (r) => (r as Record<string, unknown>).status === "completed",
  ).length;
  return Math.round((completed / rows.length) * 100);
}

/**
 * Review average sub-metric (V-2c Session 2 Stream A, mig 062). Reads
 * event_reviews where reviewee_tenant_id matches the vendor; converts
 * the 1-5 average to a 0-100 sub-metric (×20). Returns 0 if the vendor
 * has no reviews yet — same honest "no track record" handling as the
 * other sub-metrics' empty state.
 */
async function computeReviewAverage(vendorTenantId: string): Promise<number> {
  const agg = await getReviewAggregateForTenant(vendorTenantId);
  if (agg.count === 0) return 0;
  return Math.round(agg.average * 20);
}

export async function getVendorTrustScore(
  vendor: CurrentVendor,
): Promise<TrustScore> {
  const [responseRate, completionRate, profileDetail, reviewAverage] =
    await Promise.all([
      computeResponseRate(vendor.tenantId),
      computeCompletionRate(vendor.tenantId),
      computeProfileCompleteness(vendor),
      computeReviewAverage(vendor.tenantId),
    ]);

  const total = Math.round(
    reviewAverage * TRUST_WEIGHTS.reviews +
      responseRate * TRUST_WEIGHTS.response +
      completionRate * TRUST_WEIGHTS.completion +
      profileDetail.score * TRUST_WEIGHTS.profile,
  );

  return {
    total,
    tier: tierFor(total),
    subMetrics: {
      responseRate,
      completionRate,
      reviewAverage,
      profileCompleteness: profileDetail.score,
    },
    profileMissingCount: profileDetail.missingCount,
  };
}
