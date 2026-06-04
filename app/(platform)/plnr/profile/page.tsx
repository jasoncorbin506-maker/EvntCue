import { redirect } from "next/navigation";
import { Chrome, ChromeSignOut } from "../_components/Chrome";
import { getCurrentPlanner } from "@/lib/plnr/current-planner";
import { getPlnrProfile, type PlnrProfile } from "@/lib/plnr/profile";
import { getPlnrPhotos } from "@/lib/plnr/photos";
import { PlnrProfileForm } from "../_components/PlnrProfileForm";

/**
 * Planner profile-edit page (Lock 30 Phase C pt 2). Lean: business basics +
 * service levels + specialties + founding story + photos + publish. Backed by
 * migration 089 (planners + planner_photos). No menu tiers — planners sell
 * service, not per-head pricing. Mirrors the catr profile page.
 */
export default async function PlnrProfilePage() {
  const planner = await getCurrentPlanner();
  if (!planner) redirect("/login?role=plnr");

  const [profile, photos] = await Promise.all([
    getPlnrProfile(planner.tenantId),
    getPlnrPhotos(planner.tenantId),
  ]);

  // Defensive default if the planners row isn't present yet (edge — 089
  // backfilled 19 rows as pending_claim, but a fresh tenant may have none).
  const initialProfile: PlnrProfile = profile ?? {
    displayName: planner.displayName,
    city: null,
    serviceLevels: [],
    specialties: [],
    foundingStory: null,
    claimStatus: "pending_claim",
  };

  return (
    <>
      <Chrome plannerName={planner.displayName} roleLabel="Profile" backHref="/plnr" right={<ChromeSignOut />} />
      <PlnrProfileForm initialProfile={initialProfile} initialPhotos={photos} />
    </>
  );
}
