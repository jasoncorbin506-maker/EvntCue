"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import type { VenueSpaceStatus } from "@/lib/venu/availability-shared";

/**
 * Create or update a venue_spaces row. Single action handles both (id
 * present = update, absent = insert) to match the EditPackageSheet
 * pattern used in vndr-side.
 *
 * RLS vs_insert/vs_update policies scope to `tenant_id IN
 * current_user_tenants()` — spoofing the tenant in the payload is denied
 * at the database layer.
 */

export type UpsertVenueSpaceInput = {
  id?: string;
  name: string;
  capacity: number | null;
  ratePerDayCents: number;
  description: string | null;
  sqFt: number | null;
  status: VenueSpaceStatus;
};

export type UpsertVenueSpaceResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const VALID_STATUSES = new Set<VenueSpaceStatus>(["active", "inactive", "seasonal"]);

export async function upsertVenueSpace(
  input: UpsertVenueSpaceInput,
): Promise<UpsertVenueSpaceResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Give the space a name." };
  if (name.length > 80) return { ok: false, error: "Name must be 80 characters or fewer." };

  if (input.capacity !== null && (!Number.isFinite(input.capacity) || input.capacity < 0)) {
    return { ok: false, error: "Capacity must be a non-negative number." };
  }
  if (!Number.isFinite(input.ratePerDayCents) || input.ratePerDayCents < 0) {
    return { ok: false, error: "Rate must be a non-negative number." };
  }
  if (input.sqFt !== null && (!Number.isFinite(input.sqFt) || input.sqFt < 0)) {
    return { ok: false, error: "Square footage must be a non-negative number." };
  }
  if (!VALID_STATUSES.has(input.status)) {
    return { ok: false, error: "Invalid status." };
  }

  const venue = await getCurrentVenue();
  if (!venue) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const payload = {
    tenant_id: venue.tenantId,
    name,
    capacity: input.capacity,
    rate_per_day_cents: input.ratePerDayCents,
    description: input.description?.trim() || null,
    sq_ft: input.sqFt,
    status: input.status,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("venue_spaces")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Update failed." };
    revalidatePath("/venu/tools/spaces");
    revalidatePath("/venu/availability");
    return { ok: true, id: data.id as string };
  }

  const { data, error } = await supabase
    .from("venue_spaces")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed." };
  revalidatePath("/venu/tools/spaces");
  revalidatePath("/venu/availability");
  return { ok: true, id: data.id as string };
}
