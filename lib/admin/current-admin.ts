import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin gate. `/admin` is gated on `is_admin()` (the `staff_admins` table —
 * audited + revocable), independent of any tenant role. `proxy.ts` does a
 * coarse first check; this is the server-component / action-level re-check.
 *
 * DEFENSE IN DEPTH — never trust the proxy alone for a service-role surface.
 * Every admin page (via the layout) and every admin action calls this before
 * touching `createAdminClient()`. A single missing check = full tenant exposure.
 *
 * Returns the admin's user id (for stamping `suspended_by` / log `by_user`),
 * or null if the caller is not an active admin.
 */
export async function getAdminUser(): Promise<{ userId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return null;
  return { userId: user.id };
}
