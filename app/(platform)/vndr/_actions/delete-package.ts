"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Hard-delete a vendor package (migration 052). Cascade removes any
 * vendor_package_addons children via the FK ON DELETE CASCADE on
 * vendor_package_addons.package_id.
 */

export type DeletePackageResult =
  | { ok: true; deleted: boolean }
  | { ok: false; error: string };

export async function deletePackage(
  packageId: string,
): Promise<DeletePackageResult> {
  if (!packageId) return { ok: false, error: "Missing package id." };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("vendor_packages")
    .delete({ count: "exact" })
    .eq("id", packageId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vndr");
  return { ok: true, deleted: (count ?? 0) > 0 };
}
