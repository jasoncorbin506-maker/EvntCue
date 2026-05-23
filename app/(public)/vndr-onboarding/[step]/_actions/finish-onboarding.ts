"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * Stage 4 final commit. Flips vendors.claim_status from 'pending_claim' to
 * 'published' and redirects to the V-2 dashboard placeholder.
 *
 * Per master spec §75 soft-gate semantics: this action runs unconditionally.
 * Cert uploads at Stage 4 are optional discoverability gates; a vendor who
 * skips them still publishes. The Verified badge becomes available once
 * staff approves their uploaded cert (verified=true on tenant_certifications).
 *
 * Idempotent — if claim_status is already 'published' (returning vendor
 * mistakenly re-runs the funnel) we just redirect to the dashboard.
 *
 * redirect() throws NEXT_REDIRECT inside server actions, which Next.js
 * handles by issuing the 30x to the client. No explicit return needed on
 * the success path.
 */

export type FinishResult = { ok: false; error: string };

export async function finishOnboardingAction(): Promise<FinishResult | void> {
  const vendor = await getCurrentVendor();
  if (!vendor) {
    return { ok: false, error: "Your session expired. Sign in again." };
  }

  if (vendor.claimStatus === "published") {
    // Already published — just route to dashboard.
    redirect("/vndr/discover?welcome=signup");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .update({ claim_status: "published" })
    .eq("id", vendor.id);

  if (error) {
    return { ok: false, error: "Could not finalize. Try again." };
  }

  redirect("/vndr/discover?welcome=signup");
}
