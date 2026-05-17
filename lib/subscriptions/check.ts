import { createClient } from "@/lib/supabase/server";

/**
 * Lock 3 (closed 2026-05-16, session 15) — runtime subscription tier check.
 *
 * `orgnz_paid` — active orgnz_19_99 row matching the user.
 * `pro_paid`   — active pro_199 row matching the tenant.
 * `free`       — neither (or table read failed).
 *
 * Schema: see 00_Live/deploy/026_subscriptions.sql. RLS scopes reads to the
 * caller's own user_id + tenants — running on the SSR client (not admin) is
 * intentional so the check enforces the same boundary the DB does.
 *
 * Phase 4 (Stripe webhooks) writes rows on subscription.created /
 * subscription.updated. Pre-Phase-4, dev rows are inserted manually via the
 * Supabase Dashboard SQL Editor.
 */

export type SubscriptionTier = "free" | "orgnz_paid" | "pro_paid";

export async function checkSubscription(
  userId: string,
  tenantId: string | null,
): Promise<SubscriptionTier> {
  const supabase = await createClient();

  let query = supabase
    .from("subscriptions")
    .select("tier")
    .eq("status", "active");

  query = tenantId
    ? query.or(`user_id.eq.${userId},tenant_id.eq.${tenantId}`)
    : query.eq("user_id", userId);

  const { data, error } = await query;
  if (error || !data) return "free";

  if (data.some((r) => r.tier === "orgnz_19_99")) return "orgnz_paid";
  if (data.some((r) => r.tier === "pro_199")) return "pro_paid";
  return "free";
}
