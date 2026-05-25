"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * Upsert a vendor package against public.vndr_packages (legacy survivor
 * post-2026-05-25 consolidation, migration 054). Used by the Packages
 * section's full-edit flow (Session B Profile tab). Lightweight in-row
 * updates (referral % slider, visibility toggle) use updatePackageFields
 * below to avoid round-tripping the full row.
 */

export type UpsertPackageInput = {
  id?: string;
  name: string;
  description?: string | null;
  priceCents: number;
  referralPct: number;
  isVisible: boolean;
  displayOrder?: number;
};

export type UpsertPackageResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function upsertPackage(
  input: UpsertPackageInput,
): Promise<UpsertPackageResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Package name is required." };
  if (name.length > 200) return { ok: false, error: "Name too long." };
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
    return { ok: false, error: "Price must be 0 or more cents." };
  }
  if (input.referralPct < 0 || input.referralPct > 100) {
    return { ok: false, error: "Referral % must be between 0 and 100." };
  }

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const payload = {
    tenant_id: vendor.tenantId,
    name,
    description: input.description ?? null,
    price_cents: input.priceCents,
    referral_pct: input.referralPct,
    is_visible: input.isVisible,
    display_order: input.displayOrder ?? 0,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("vndr_packages")
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
    .from("vndr_packages")
    .insert({ ...payload, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed." };
  }
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}

/**
 * Partial-update for inline controls (slider + visibility toggle). Keeps
 * the wire payload tiny and avoids re-validating full row constraints.
 */
export type UpdatePackageFieldsInput = {
  id: string;
  referralPct?: number;
  isVisible?: boolean;
};

export async function updatePackageFields(
  input: UpdatePackageFieldsInput,
): Promise<UpsertPackageResult> {
  if (!input.id) return { ok: false, error: "Missing package id." };
  const patch: Record<string, unknown> = {};
  if (input.referralPct !== undefined) {
    if (input.referralPct < 0 || input.referralPct > 100) {
      return { ok: false, error: "Referral % must be 0–100." };
    }
    patch.referral_pct = input.referralPct;
  }
  if (input.isVisible !== undefined) {
    patch.is_visible = input.isVisible;
  }
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No fields to update." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vndr_packages")
    .update(patch)
    .eq("id", input.id)
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Update failed." };
  }
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
