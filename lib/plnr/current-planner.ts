import { createClient } from "@/lib/supabase/server";

export type CurrentPlanner = {
  tenantId: string;
  displayName: string;
};

/**
 * Returns the planner tenant for the currently-signed-in user, or null.
 *
 * Mirrors lib/catr/current-caterer.ts. Like catr, a planner is a `tenants` row
 * plus a user_roles role='plnr'; the `planners` domain row (migration 089)
 * carries the profile but the resolver reads the tenant directly for its
 * display name so it works even before a planners row is touched.
 *
 * proxy.ts already gates /plnr/* to role='plnr' or 'admin', so unauthenticated
 * callers never reach here. Null covers an admin viewing without a plnr tenant
 * or a data inconsistency. Page-level handling redirects null → /login?role=plnr.
 */
export async function getCurrentPlanner(): Promise<CurrentPlanner | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "plnr")
    .order("created_at", { ascending: false })
    .limit(1);

  const tenantId = roles?.[0]?.tenant_id as string | undefined;
  if (!tenantId) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) return null;

  return {
    tenantId: tenant.id as string,
    displayName: (tenant.name as string | null) ?? "Your studio",
  };
}
