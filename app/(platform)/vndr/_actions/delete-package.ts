"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Hard-delete a vendor package against public.vndr_packages (legacy survivor
 * post-2026-05-25 consolidation, migration 054). Cascade removes any
 * vndr_package_addons children via the FK ON DELETE CASCADE on
 * vndr_package_addons.package_id.
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
    .from("vndr_packages")
    .delete({ count: "exact" })
    .eq("id", packageId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vndr");
  return { ok: true, deleted: (count ?? 0) > 0 };
}
