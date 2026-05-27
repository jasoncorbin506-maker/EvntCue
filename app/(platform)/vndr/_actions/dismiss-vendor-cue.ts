"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * Vendor permanently dismisses a Cue ladder branch (mig 064). Upserts
 * into vendor_cue_dismissals so re-dismissing the same key is a no-op
 * (unique constraint on (vendor_tenant_id, cue_key)).
 *
 * Replaces session 24's sessionStorage path. CuePanel calls this on
 * × click; on success the dismissed key is added to the local set so
 * the next ladder branch surfaces immediately.
 */

export type DismissVendorCueResult =
  | { ok: true }
  | { ok: false; error: string };

export async function dismissVendorCue(
  cueKey: string,
): Promise<DismissVendorCueResult> {
  if (!cueKey) return { ok: false, error: "Missing cue key." };

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("vendor_cue_dismissals")
    .upsert(
      { vendor_tenant_id: vendor.tenantId, cue_key: cueKey },
      { onConflict: "vendor_tenant_id,cue_key" },
    );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vndr");
  return { ok: true };
}
