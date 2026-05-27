import "server-only";
import { hasVenueAttachedCalendar } from "@/lib/venu/availability";

/**
 * Forward-looking facade for the V-2d public Discover marketplace surface.
 *
 * As of Session A 2026-05-27 (venue-calendar arc, Cowork brief
 * inbox-cc/2026-05-26-venue-calendar-availability-full-import-arc.md), the
 * public Discover route is NOT built. `/venu/discover` exists but is the
 * venue-operator's own dashboard inside the platform portal, not the public
 * listing.
 *
 * When V-2d Discover ships, the listing query filters venues through
 * isVenueDiscoverable() — true iff the venue has attached a calendar
 * (subscribed an iCal feed, imported a CSV, or attested no existing
 * reservations elsewhere). This prevents the marketplace from surfacing
 * venues on dates they're actually booked-out at via Tripleseat / Honeybook
 * / Aisle Planner / Caterease / spreadsheet.
 *
 * The implementation delegates to lib/venu/availability.hasVenueAttachedCalendar
 * because the data lives next to the rest of the availability domain. This
 * file gives V-2d Discover code a stable import path (`@/lib/discover/venues`)
 * so the gating call site doesn't reach across into venu/.
 */

/**
 * Discover-gating predicate. Returns true if the venue should be surfaced
 * in the public marketplace listing.
 */
export async function isVenueDiscoverable(
  venueTenantId: string,
): Promise<boolean> {
  return hasVenueAttachedCalendar(venueTenantId);
}
