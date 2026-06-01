import { redirect } from "next/navigation";
import { Chrome, LivePill } from "../../_components/Chrome";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import { getVenuePhotos } from "@/lib/venu/photos";
import { VenuePhotosGrid } from "../../_components/VenuePhotosGrid";
import s from "../../venu.module.css";

/**
 * Venu Atmosphere Board — venue portfolio photos (Lock 30 Phase B). The
 * ToolRow at /venu/tools already links here. Photos feed the public
 * marketplace profile gallery (and, later, Cue's atmosphere matching).
 */
export default async function VenuAtmosphere() {
  const venue = await getCurrentVenue();
  if (!venue) redirect("/venues");

  const photos = await getVenuePhotos(venue.tenantId);

  return (
    <>
      <Chrome venueName={venue.displayName} roleLabel="Atmosphere" right={<LivePill />} backHref="/venu/tools" />

      <section className={s.toolsHero}>
        <div className={s.toolsHeroBody}>
          <div className={s.toolsHeroEyebrow}>Atmosphere board</div>
          <div className={s.toolsHeroH}>
            Show couples <b>the room.</b>
          </div>
        </div>
      </section>

      <VenuePhotosGrid initial={photos} />
    </>
  );
}
