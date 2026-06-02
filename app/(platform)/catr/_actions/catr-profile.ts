"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCaterer } from "@/lib/catr/current-caterer";

/**
 * Lean caterer profile-edit actions (Lock 30 Phase C). A caterer edits their
 * profile + per-head menu tiers and publishes to the marketplace. All writes go
 * under the caterer's own RLS (catr_* / cmt_* policies scope to own tenant);
 * the tenant guard is implicit in those policies.
 */

export type CatrActionResult = { ok: true } | { ok: false; error: string };

function splitCsv(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function saveCatrProfile(input: {
  displayName: string;
  city: string;
  cuisineTypes: string; // comma-separated from the form
  serviceStyles: string; // comma-separated
  publish: boolean;
}): Promise<CatrActionResult> {
  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };
  if (!input.displayName.trim()) return { ok: false, error: "Add your catering business name." };

  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    tenant_id: caterer.tenantId,
    display_name: input.displayName.trim(),
    city: input.city.trim() || null,
    cuisine_types: splitCsv(input.cuisineTypes),
    service_styles: splitCsv(input.serviceStyles),
    updated_at: new Date().toISOString(),
  };
  if (input.publish) patch.claim_status = "published";

  // Upsert on the tenant_id unique key — covers caterers with no backfilled row
  // (new signups) as well as existing ones. tenant_id is a plain unique column,
  // not an expression index, so onConflict is safe here.
  const { error } = await supabase
    .from("caterers")
    .upsert(patch, { onConflict: "tenant_id" });
  if (error) return { ok: false, error: "Couldn't save your profile — please try again." };

  revalidatePath("/catr/profile");
  revalidatePath("/catr");
  return { ok: true };
}

export async function saveCatrMenuTier(input: {
  id?: string | null;
  name: string;
  description?: string | null;
  perGuestCents: number | null;
  minGuests: number | null;
}): Promise<CatrActionResult> {
  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };
  if (!input.name.trim()) return { ok: false, error: "Give the tier a name." };

  const supabase = await createClient();
  const row = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    per_guest_cents: input.perGuestCents,
    min_guests: input.minGuests,
  };

  if (input.id) {
    const { error } = await supabase
      .from("catr_menu_tiers")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("tenant_id", caterer.tenantId);
    if (error) return { ok: false, error: "Couldn't save the tier." };
  } else {
    const { error } = await supabase
      .from("catr_menu_tiers")
      .insert({ ...row, tenant_id: caterer.tenantId });
    if (error) return { ok: false, error: "Couldn't add the tier." };
  }

  revalidatePath("/catr/profile");
  return { ok: true };
}

export async function deleteCatrMenuTier(id: string): Promise<CatrActionResult> {
  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("catr_menu_tiers")
    .delete()
    .eq("id", id)
    .eq("tenant_id", caterer.tenantId);
  if (error) return { ok: false, error: "Couldn't remove the tier." };

  revalidatePath("/catr/profile");
  return { ok: true };
}
