import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { VenueSpace } from "./availability-shared";

/**
 * Server reads for venue_spaces. RLS-scoped: vs_select is public so anyone
 * can read; vs_insert/update gated to own-tenant. For the venu portal we
 * filter by tenant_id explicitly anyway.
 *
 * Used by /venu/availability (AvailabilityBlockSheet's space picker) — a
 * single-space venue hides the picker; multi-space venues show it with
 * "Whole venue" as the default option.
 */

function shape(row: Record<string, unknown>): VenueSpace {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    status: row.status as string,
  };
}

export async function getVenueSpaces(
  venueTenantId: string,
): Promise<VenueSpace[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_spaces")
    .select("id, tenant_id, name, status")
    .eq("tenant_id", venueTenantId)
    .eq("status", "active")
    .order("name", { ascending: true });
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}
