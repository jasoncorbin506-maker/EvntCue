import { createClient } from "@/lib/supabase/server";

export type CurrentVendor = {
  id: string;
  tenantId: string;
  displayName: string;
  primaryCategory: string | null;
  primarySubType: string | null;
  // Multi-select sub-types per V-1c (migration 047). First element mirrors
  // primarySubType (back-compat invariant). Empty array when no sub-types
  // selected — same semantic as primarySubType being null.
  primarySubTypes: string[];
  claimStatus: string;
};

/**
 * Returns the vendor owned by the currently-signed-in user, or null.
 *
 * V-1b authed-funnel entry point. Stages 1–4 of /vndr-onboarding live under
 * the public route group but require auth (per V-1b auth boundary decision
 * A — auth resolves between Stage 0 and Stage 1; postAuthSeed creates the
 * draft vendors row on signup, then this resolver retrieves it on every
 * subsequent Stage 1–4 visit).
 *
 * Null returns cover:
 *   - User signed in but no vndr role (Orgnz / Venu visiting /vndr-onboarding/N)
 *   - postAuthSeed never ran the vndr branch (data inconsistency — should be
 *     rare; would mean the draft vendors row was never seeded)
 *
 * Page-level handling: redirect null → /login?role=vndr&intent=claim_listing
 * so the auth flow re-runs postAuthSeed and the draft vendors row is seeded.
 *
 * Mirrors lib/venu/current-venue.ts (Venu portal resolver, session 18 / Phase
 * 5 wire-DB). Both doors converge: Door A (claim flow at /vendors/claim/[token])
 * and Door B self-serve (V-1b funnel) both produce a vendors row scoped to
 * the user's tenant via user_roles — this resolver doesn't branch on
 * acquisition_lane because the dashboard surface is identical (per V-2 brief).
 */
export async function getCurrentVendor(): Promise<CurrentVendor | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "vndr")
    .order("created_at", { ascending: false })
    .limit(1);

  const tenantId = roles?.[0]?.tenant_id as string | undefined;
  if (!tenantId) return null;

  const { data: vendors } = await supabase
    .from("vendors")
    .select(
      "id, tenant_id, display_name, primary_category, primary_sub_type, sub_types, claim_status",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1);

  const vendor = vendors?.[0];
  if (!vendor) return null;

  const rawSubTypes = vendor.sub_types as string[] | null | undefined;

  return {
    id: vendor.id as string,
    tenantId: vendor.tenant_id as string,
    displayName: vendor.display_name as string,
    primaryCategory: (vendor.primary_category as string | null) ?? null,
    primarySubType: (vendor.primary_sub_type as string | null) ?? null,
    primarySubTypes: Array.isArray(rawSubTypes) ? rawSubTypes : [],
    claimStatus: vendor.claim_status as string,
  };
}
