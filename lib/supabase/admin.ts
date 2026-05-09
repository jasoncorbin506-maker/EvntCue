import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS — server-only.
// Use ONLY for tables explicitly marked "no RLS, service role only" (e.g., landing_capture_sessions, migration 009).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
