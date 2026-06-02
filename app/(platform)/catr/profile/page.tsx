import { redirect } from "next/navigation";
import { Chrome, ChromeSignOut } from "../_components/Chrome";
import { getCurrentCaterer } from "@/lib/catr/current-caterer";
import { getCatrProfile, getCatrMenuTiers, type CatrProfile } from "@/lib/catr/profile";
import { CatrProfileForm } from "../_components/CatrProfileForm";

/**
 * Caterer profile-edit page (Lock 30 Phase C). Lean: business basics +
 * per-head menu tiers + publish. Backed by migration 086 (caterers +
 * catr_menu_tiers). Photos deferred to a later sub-phase.
 */
export default async function CatrProfilePage() {
  const caterer = await getCurrentCaterer();
  if (!caterer) redirect("/login?role=catr");

  const [profile, tiers] = await Promise.all([
    getCatrProfile(caterer.tenantId),
    getCatrMenuTiers(caterer.tenantId),
  ]);

  // Defensive default if the caterers row isn't present yet (pre-086 / edge).
  const initialProfile: CatrProfile = profile ?? {
    displayName: caterer.displayName,
    city: null,
    cuisineTypes: [],
    serviceStyles: [],
    claimStatus: "pending_claim",
  };

  return (
    <>
      <Chrome catererName={caterer.displayName} roleLabel="Profile" backHref="/catr" right={<ChromeSignOut />} />
      <CatrProfileForm initialProfile={initialProfile} initialTiers={tiers} />
    </>
  );
}
