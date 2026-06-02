import {
  getMarketplaceVendors,
  getMarketplaceVenues,
  getMarketplaceCaterers,
} from "@/lib/marketplace/listings";
import { getOrgnzActiveEvents } from "@/lib/orgnz/active-events";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";
import { getInvitedTenantIds } from "@/lib/moodboard/invites";
import { BrowseClient } from "./_components/BrowseClient";

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
  const [{ focus }, vendors, venues, caterers, activeEvents, invitedTenantIds] =
    await Promise.all([
      searchParams,
      getMarketplaceVendors(),
      getMarketplaceVenues(),
      getMarketplaceCaterers(),
      getOrgnzActiveEvents(),
      organizer ? getInvitedTenantIds(organizer.tenantId) : Promise.resolve([]),
    ]);

  return (
    <BrowseClient
      vendors={vendors}
      venues={venues}
      caterers={caterers}
      activeEvents={activeEvents}
      invitedTenantIds={invitedTenantIds}
      initialFocus={focus ?? null}
    />
  );
}
