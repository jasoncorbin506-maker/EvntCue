import { headers } from "next/headers";
import {
  getMarketplaceVendors,
  getMarketplaceVenues,
  getMarketplaceCaterers,
  getMarketplacePlanners,
} from "@/lib/marketplace/listings";
import { getOrgnzActiveEvents } from "@/lib/orgnz/active-events";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";
import { getInvitedTenantIds } from "@/lib/moodboard/invites";
import { BrowseClient } from "./_components/BrowseClient";

// PL #61 — the Chrome's selected event, forwarded by proxy.ts as a request
// header. Threading it here defaults the inquiry/invite composers to the event
// the buyer is actually viewing, not the earliest-dated one.
const ORGNZ_EVENT_HEADER = "x-orgnz-event-id";

/**
 * Orgnz marketplace browse (V-2d). Server-fetches the published listings from
 * the curated marketplace views (migration 078, RLS-safe) and hands them to the
 * client tile grid. Until 078 is applied the fetchers degrade to empty lists.
 *
 * Deep-link focus (e.g. /orgnz/browse?focus=plnr) pre-selects a tile.
 */
export default async function OrgnzBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const organizer = await getCurrentOrganizer();
  const [{ focus }, hdrs, vendors, venues, caterers, planners, activeEvents, invitedTenantIds] =
    await Promise.all([
      searchParams,
      headers(),
      getMarketplaceVendors(),
      getMarketplaceVenues(),
      getMarketplaceCaterers(),
      getMarketplacePlanners(),
      getOrgnzActiveEvents(),
      organizer ? getInvitedTenantIds(organizer.tenantId) : Promise.resolve([]),
    ]);

  const selectedEventId = hdrs.get(ORGNZ_EVENT_HEADER)?.trim() || null;

  return (
    <BrowseClient
      vendors={vendors}
      venues={venues}
      caterers={caterers}
      planners={planners}
      activeEvents={activeEvents}
      invitedTenantIds={invitedTenantIds}
      initialFocus={focus ?? null}
      selectedEventId={selectedEventId}
    />
  );
}
