import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side read for vendor_cue_dismissals (mig 064). Returns the set
 * of cue_keys this vendor has permanently dismissed. CuePanel uses this
 * to filter the ladder; assembleVndrHomeCue stays pure (no DB).
 *
 * RLS scopes the read to the caller's tenant; passing vendorTenantId
 * explicitly is a sanity guard, not the security boundary.
 */
export async function getVendorCueDismissals(
  vendorTenantId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendor_cue_dismissals")
    .select("cue_key")
    .eq("vendor_tenant_id", vendorTenantId);
  return (data ?? []).map((r) => (r as Record<string, unknown>).cue_key as string);
}
