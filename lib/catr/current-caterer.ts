import { createClient } from "@/lib/supabase/server";

export type CurrentCaterer = {
  tenantId: string;
  displayName: string;
};

/**
 * Returns the caterer tenant for the currently-signed-in user, or null.
 *
 * Unlike vndr/venu, catr has no domain row table (no `caterers`) — a caterer
 * is just a `tenants` row with type='catr' plus a user_roles role='catr'
 * (postAuthSeed creates exactly this and nothing else). So the resolver reads
 * the tenant directly for its display name. Per Lock 77 (closed 2026-05-28)
 * Catr is an "expanded Vndr" at the inquiry-primitive layer — the catr-specific
 * feature stack (menu / BEO / food-safety) is deferred; this portal scaffolds
 * the inquiry surface only.
 *
 * proxy.ts already gates /catr/* to role='catr' or 'admin', so unauthenticated
 * callers never reach here. Null covers an admin viewing without a catr tenant
 * or a data inconsistency. Page-level handling redirects null → /login?role=catr.
 */
export async function getCurrentCaterer(): Promise<CurrentCaterer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "catr")
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
    displayName: (tenant.name as string | null) ?? "Your kitchen",
  };
}
