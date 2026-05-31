import { getMarketplaceVendors, getMarketplaceVenues } from "@/lib/marketplace/listings";
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
  const [{ focus }, vendors, venues] = await Promise.all([
    searchParams,
    getMarketplaceVendors(),
    getMarketplaceVenues(),
  ]);

  return <BrowseClient vendors={vendors} venues={venues} initialFocus={focus ?? null} />;
}
