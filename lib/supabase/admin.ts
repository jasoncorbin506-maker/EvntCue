import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS — server-only.
// Use ONLY for tables in the "service-role only" set (e.g. landing_capture_sessions,
// migration_log). Those tables now ALSO have RLS enabled with a deny-all policy for
// anon/authenticated (migration 036) — "service-role only" is the access convention,
// the deny-all RLS is the enforced boundary. The service role bypasses RLS, so these
// paths keep working; never reach for this client just to dodge a policy.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
