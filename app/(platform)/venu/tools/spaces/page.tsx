import { redirect } from "next/navigation";
import { Chrome, ChromeSignOut } from "../../_components/Chrome";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import { getVenueSpacesAll } from "@/lib/venu/venue-spaces";
import { SpacesManager } from "./_components/SpacesManager";

/**
 * /venu/tools/spaces — operator-facing space management.
 *
 * Lists every space (active / inactive / seasonal) so the operator can
 * see archived rooms they might want to bring back. The active subset
 * surfaces in AvailabilityBlockSheet's per-space picker.
 *
 * Per Venu_Locked_2026-05-13.md row 4 ("Your spaces · Up to 3 · pricing
 * · layouts · availability"), the Free tier soft-caps at 3 spaces. This
 * page doesn't enforce that cap yet — caps land alongside Pro upgrade
 * flow when subscription primitives wire (Phase 4). For now: unlimited
 * adds, honest about the deferred cap in the empty-state hint.
 */
export default async function VenuSpacesPage() {
  const venue = await getCurrentVenue();
  if (!venue) redirect("/venues");

  const spaces = await getVenueSpacesAll(venue.tenantId);

  return (
    <>
      <Chrome
        venueName={venue.displayName}
        roleLabel="Your spaces"
        backHref="/venu/tools"
        right={<ChromeSignOut />}
      />
      <SpacesManager spaces={spaces} />
    </>
  );
}
