"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Upsert a vendor package addon (migration 053). RLS gates via the
 * user_owns_vendor_package() helper from migration 052.
 */

export type UpsertPackageAddonInput = {
  id?: string;
  packageId: string;
  name: string;
  description?: string | null;
  priceCents: number;
  displayOrder?: number;
};

export type UpsertPackageAddonResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function upsertPackageAddon(
  input: UpsertPackageAddonInput,
): Promise<UpsertPackageAddonResult> {
  if (!input.packageId) return { ok: false, error: "Missing package id." };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Addon name is required." };
  if (name.length > 200) return { ok: false, error: "Name too long." };
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
    return { ok: false, error: "Price must be 0 or more cents." };
  }

  const supabase = await createClient();
  const payload = {
    package_id: input.packageId,
    name,
    description: input.description ?? null,
    price_cents: input.priceCents,
    display_order: input.displayOrder ?? 0,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("vendor_package_addons")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message ?? "Update failed." };
    }
    revalidatePath("/vndr");
    return { ok: true, id: data.id as string };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("vendor_package_addons")
    .insert({ ...payload, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed." };
  }
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
