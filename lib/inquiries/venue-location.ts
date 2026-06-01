import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolve manual venue locations for a set of event ids (Lock 30 — migration
 * 084). Sellers (vndr/catr) receive an inquiry but have no direct RLS read on
 * the buyer's `events` row, so this resolves the location via the admin client,
 * scoped to the event ids the seller legitimately has inquiries for.
 *
 * The home/business flag is the load-bearing field: it lets a vndr who doesn't
 * service private residences opt out (decline) early. Returns only events that
 * actually have a manual location set (a marketplace-venue booking has none).
 */

export type EventVenueLocation = {
  locationType: "business" | "home" | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
};

export async function resolveVenueLocations(
  eventIds: string[],
): Promise<Map<string, EventVenueLocation>> {
  const out = new Map<string, EventVenueLocation>();
  const ids = Array.from(new Set(eventIds.filter(Boolean)));
  if (ids.length === 0) return out;

  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select(
      "id, venue_address_line1, venue_address_line2, venue_city, venue_state, venue_postal_code, venue_location_type",
    )
    .in("id", ids);

  for (const r of data ?? []) {
    const row = r as Record<string, unknown>;
    const line1 = (row.venue_address_line1 as string | null) ?? null;
    const locationType = (row.venue_location_type as "business" | "home" | null) ?? null;
    // Only surface rows that actually carry a manual location.
    if (!line1 && !locationType) continue;
    out.set(row.id as string, {
      locationType,
      line1,
      line2: (row.venue_address_line2 as string | null) ?? null,
      city: (row.venue_city as string | null) ?? null,
      state: (row.venue_state as string | null) ?? null,
      postalCode: (row.venue_postal_code as string | null) ?? null,
    });
  }
  return out;
}

/** One-shot helper for the single-inquiry detail path. */
export async function resolveVenueLocation(
  eventId: string | null,
): Promise<EventVenueLocation | null> {
  if (!eventId) return null;
  const map = await resolveVenueLocations([eventId]);
  return map.get(eventId) ?? null;
}
