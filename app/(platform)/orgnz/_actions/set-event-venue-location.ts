"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";

/**
 * Save a manual venue location on an event (Lock 30 — the private / backyard
 * case, reached from the "Not for us" prompt on the Browse-Venu card). Stores a
 * full address (line2 carries suite/room) + a business/home type. Columns added
 * in migration 084; the CHECK enforces the business/home values DB-side.
 *
 * Written under the organizer's own RLS (they own the event); the orgnz_tenant_id
 * guard ensures it's this organizer's event.
 */

export type SetVenueLocationResult = { ok: true } | { ok: false; error: string };

const LOCATION_TYPES = ["business", "home"] as const;
type LocationType = (typeof LOCATION_TYPES)[number];

export async function setEventVenueLocation(input: {
  eventId: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  locationType: LocationType;
}): Promise<SetVenueLocationResult> {
  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, error: "Your session expired — sign in again." };

  if (!input.line1.trim() || !input.city.trim() || !input.state.trim() || !input.postalCode.trim()) {
    return { ok: false, error: "Add the street, city, state, and ZIP." };
  }
  if (!LOCATION_TYPES.includes(input.locationType)) {
    return { ok: false, error: "Pick whether it's a business or a home." };
  }

  const supabase = await createClient();

  // Confirm ownership before writing (RLS also enforces this).
  const { data: event } = await supabase
    .from("events")
    .select("id, orgnz_tenant_id")
    .eq("id", input.eventId)
    .maybeSingle();
  if (!event || (event.orgnz_tenant_id as string) !== organizer.tenantId) {
    return { ok: false, error: "We couldn't find that event." };
  }

  const { error } = await supabase
    .from("events")
    .update({
      venue_address_line1: input.line1.trim(),
      venue_address_line2: input.line2?.trim() || null,
      venue_city: input.city.trim(),
      venue_state: input.state.trim(),
      venue_postal_code: input.postalCode.trim(),
      venue_location_type: input.locationType,
    })
    .eq("id", input.eventId);

  if (error) {
    return { ok: false, error: "Couldn't save the location — please try again." };
  }

  revalidatePath("/orgnz");
  return { ok: true };
}
