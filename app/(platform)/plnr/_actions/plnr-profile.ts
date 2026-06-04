"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPlanner } from "@/lib/plnr/current-planner";

/**
 * Lean planner profile-edit action (Lock 30 Phase C pt 2). A planner edits their
 * profile and publishes to the marketplace. Writes go under the planner's own
 * RLS (planners own-tenant policy); the tenant guard is implicit in the policy.
 *
 * Unlike catr there are NO menu tiers — a planner has service levels +
 * specialties + a founding story, but no per-head pricing. Mirrors
 * saveCatrProfile otherwise.
 */

export type PlnrActionResult = { ok: true } | { ok: false; error: string };

function splitCsv(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function savePlnrProfile(input: {
  displayName: string;
  city: string;
  serviceLevels: string; // comma-separated from the form (chip selection)
  specialties: string; // comma-separated free chips
  foundingStory: string;
  publish: boolean;
}): Promise<PlnrActionResult> {
  const planner = await getCurrentPlanner();
  if (!planner) return { ok: false, error: "Not signed in." };
  if (!input.displayName.trim()) return { ok: false, error: "Add your studio name." };

  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    tenant_id: planner.tenantId,
    display_name: input.displayName.trim(),
    city: input.city.trim() || null,
    service_levels: splitCsv(input.serviceLevels),
    specialties: splitCsv(input.specialties),
    founding_story: input.foundingStory.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (input.publish) patch.claim_status = "published";

  // Upsert on the tenant_id unique key — covers planners with no backfilled row
  // as well as the 19 pending_claim rows already seeded. tenant_id is a plain
  // unique column, not an expression index, so onConflict is safe here.
  const { error } = await supabase
    .from("planners")
    .upsert(patch, { onConflict: "tenant_id" });
  if (error) return { ok: false, error: "Couldn't save your profile — please try again." };

  revalidatePath("/plnr/profile");
  revalidatePath("/plnr");
  return { ok: true };
}
