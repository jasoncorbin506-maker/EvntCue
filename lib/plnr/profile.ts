import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Planner's own profile for the lean profile-edit page (Lock 30 Phase C). Read
 * under the planner's own RLS (planners own-tenant select). The buyer-facing
 * marketplace reads the published views instead.
 *
 * Unlike catr there are NO menu tiers — a planner sells service, not per-head
 * pricing. The bio lives in `founding_story`.
 */

export type PlnrProfile = {
  displayName: string | null;
  city: string | null;
  serviceLevels: string[];
  specialties: string[];
  foundingStory: string | null;
  claimStatus: string;
};

export async function getPlnrProfile(tenantId: string): Promise<PlnrProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("planners")
    .select("display_name, city, service_levels, specialties, founding_story, claim_status")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!data) return null;
  return {
    displayName: (data.display_name as string | null) ?? null,
    city: (data.city as string | null) ?? null,
    serviceLevels: (data.service_levels as string[] | null) ?? [],
    specialties: (data.specialties as string[] | null) ?? [],
    foundingStory: (data.founding_story as string | null) ?? null,
    claimStatus: (data.claim_status as string | null) ?? "pending_claim",
  };
}
