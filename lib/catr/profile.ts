import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Caterer's own profile + menu tiers for the lean profile-edit page (Lock 30
 * Phase C). Read under the caterer's own RLS (catr_select / cmt_select scope to
 * own tenant). The buyer-facing marketplace reads the published views instead.
 */

export type CatrProfile = {
  displayName: string | null;
  city: string | null;
  cuisineTypes: string[];
  serviceStyles: string[];
  claimStatus: string;
};

export type CatrMenuTierRow = {
  id: string;
  name: string;
  description: string | null;
  perGuestCents: number | null;
  minGuests: number | null;
  sortOrder: number;
  active: boolean;
};

export async function getCatrProfile(tenantId: string): Promise<CatrProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("caterers")
    .select("display_name, city, cuisine_types, service_styles, claim_status")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!data) return null;
  return {
    displayName: (data.display_name as string | null) ?? null,
    city: (data.city as string | null) ?? null,
    cuisineTypes: (data.cuisine_types as string[] | null) ?? [],
    serviceStyles: (data.service_styles as string[] | null) ?? [],
    claimStatus: (data.claim_status as string | null) ?? "pending_claim",
  };
}

export async function getCatrMenuTiers(tenantId: string): Promise<CatrMenuTierRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catr_menu_tiers")
    .select("id, name, description, per_guest_cents, min_guests, sort_order, active")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string | null) ?? null,
      perGuestCents: (row.per_guest_cents as number | null) ?? null,
      minGuests: (row.min_guests as number | null) ?? null,
      sortOrder: (row.sort_order as number | null) ?? 0,
      active: Boolean(row.active),
    };
  });
}
