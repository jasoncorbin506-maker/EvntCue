"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Hard-delete a vendor package addon against public.vndr_package_addons
 * (created 2026-05-25 in migration 054 during consolidation). RLS gates
 * via user_owns_vndr_package() on the parent package.
 */

export type DeletePackageAddonResult =
  | { ok: true; deleted: boolean }
  | { ok: false; error: string };

export async function deletePackageAddon(
  addonId: string,
): Promise<DeletePackageAddonResult> {
  if (!addonId) return { ok: false, error: "Missing addon id." };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("vndr_package_addons")
    .delete({ count: "exact" })
    .eq("id", addonId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vndr");
  return { ok: true, deleted: (count ?? 0) > 0 };
}
