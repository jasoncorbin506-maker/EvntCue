"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * Bulk reorder of vendor_photos display_order (V-2c Session 3 Stream A,
 * mig 056 backed). Accepts an array of {id, display_order} pairs and
 * issues one UPDATE per row. RLS on vendor_photos (mig 056) gates each
 * UPDATE to the vendor's own rows; cross-tenant attempts silently no-op.
 *
 * The client (PhotosGrid) sends the full ordered ID list — display_order
 * is computed as the index. Keeps the action's contract simple at the
 * cost of a few extra UPDATEs vs sending only the changed rows.
 */

export type ReorderVendorPhotosInput = {
  orderedIds: string[];
};

export type ReorderVendorPhotosResult =
  | { ok: true; updated: number }
  | { ok: false; error: string };

export async function reorderVendorPhotos(
  input: ReorderVendorPhotosInput,
): Promise<ReorderVendorPhotosResult> {
  if (!Array.isArray(input.orderedIds) || input.orderedIds.length === 0) {
    return { ok: false, error: "Nothing to reorder." };
  }

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  let updated = 0;
  for (let i = 0; i < input.orderedIds.length; i++) {
    const id = input.orderedIds[i];
    const { error, count } = await supabase
      .from("vendor_photos")
      .update({ display_order: i }, { count: "exact" })
      .eq("id", id)
      .eq("tenant_id", vendor.tenantId);
    if (error) return { ok: false, error: error.message };
    updated += count ?? 0;
  }
  revalidatePath("/vndr/profile");
  return { ok: true, updated };
}
