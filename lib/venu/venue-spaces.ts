import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { VenueSpace, VenueSpaceStatus } from "./availability-shared";

/**
 * Server reads for venue_spaces. RLS-scoped: vs_select is public so anyone
 * can read; vs_insert/update gated to own-tenant. For the venu portal we
 * filter by tenant_id explicitly anyway.
 *
 * Two reads:
 * - getVenueSpaces — active-only; for the AvailabilityBlockSheet picker
 *   (only show spaces operators can currently book against)
 * - getVenueSpacesAll — every status (active/inactive/seasonal); for the
 *   /venu/tools/spaces management page so operators can edit archived
 *   spaces back to active
 */

const COLS = "id, tenant_id, name, status, capacity, rate_per_day_cents, description, sq_ft";

function shape(row: Record<string, unknown>): VenueSpace {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    status: row.status as VenueSpaceStatus,
    capacity: (row.capacity as number | null) ?? null,
    ratePerDayCents: (row.rate_per_day_cents as number | null) ?? 0,
    description: (row.description as string | null) ?? null,
    sqFt: (row.sq_ft as number | null) ?? null,
  };
}

export async function getVenueSpaces(
  venueTenantId: string,
): Promise<VenueSpace[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_spaces")
    .select(COLS)
    .eq("tenant_id", venueTenantId)
    .eq("status", "active")
    .order("name", { ascending: true });
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

export async function getVenueSpacesAll(
  venueTenantId: string,
): Promise<VenueSpace[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_spaces")
    .select(COLS)
    .eq("tenant_id", venueTenantId)
    .order("status", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}
