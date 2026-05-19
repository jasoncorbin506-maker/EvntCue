import { createClient } from "@/lib/supabase/server";

export type CurrentVenue = {
  id: string;
  tenantId: string;
  displayName: string;
  city: string | null;
  state: string | null;
  claimStatus: string;
};

/**
 * Returns the venue owned by the currently-signed-in user, or null.
 *
 * proxy.ts already gates /venu/* to users with role='venue' or 'admin',
 * so unauthenticated callers never reach here. Null returns cover:
 *   - Admin viewing the portal without owning a venue
 *   - Data inconsistency (role row exists, venues row missing)
 *
 * Page-level handling: redirect null to /venues for now. Admin
 * impersonation lands with the Admin panel (Phase 6d).
 */
export async function getCurrentVenue(): Promise<CurrentVenue | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "venue")
    .order("created_at", { ascending: false })
    .limit(1);

  const tenantId = roles?.[0]?.tenant_id as string | undefined;
  if (!tenantId) return null;

  const { data: venues } = await supabase
    .from("venues")
    .select("id, tenant_id, display_name, city, state, claim_status")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1);

  const venue = venues?.[0];
  if (!venue) return null;

  return {
    id: venue.id as string,
    tenantId: venue.tenant_id as string,
    displayName: venue.display_name as string,
    city: (venue.city as string | null) ?? null,
    state: (venue.state as string | null) ?? null,
    claimStatus: venue.claim_status as string,
  };
}
