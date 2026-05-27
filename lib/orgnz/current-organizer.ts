import { createClient } from "@/lib/supabase/server";

export type CurrentOrganizer = {
  userId: string;
  tenantId: string;
};

/**
 * Returns the organizer tenant owned by the currently-signed-in user, or
 * null. Mirrors lib/vndr/current-vendor.ts; orgnz has no `vendors`-like
 * profile row to load, so the shape is minimal (userId + tenantId).
 *
 * Null returns cover:
 *   - User not signed in
 *   - Signed-in user has no 'orgnz' role
 *
 * Caller decides redirect target (typically /login?role=orgnz).
 */
export async function getCurrentOrganizer(): Promise<CurrentOrganizer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "orgnz")
    .order("created_at", { ascending: false })
    .limit(1);

  const tenantId = roles?.[0]?.tenant_id as string | undefined;
  if (!tenantId) return null;

  return {
    userId: user.id,
    tenantId,
  };
}
