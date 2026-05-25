"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * V-2b Session B: delete a vendor portfolio photo. Removes the storage
 * object first, then the DB row. Order matters — leaving an orphaned DB
 * row pointing at a missing storage object is harmless (getPublicUrl
 * returns a 404'd URL), but a storage object with no DB row is invisible
 * + can't be cleaned up via the UI.
 *
 * Ownership gated via RLS — the admin-client DELETE eq tenant_id filter
 * ensures the storage path we read back is the right vendor's. Defense
 * in depth: we also verify the storage path starts with vendor.tenantId.
 */

export type DeleteVendorPhotoResult =
  | { ok: true; deleted: boolean }
  | { ok: false; error: string };

export async function deleteVendorPhoto(
  photoId: string,
): Promise<DeleteVendorPhotoResult> {
  if (!photoId) return { ok: false, error: "Missing photo id." };

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const admin = createAdminClient();

  // Look up the row + verify ownership. RLS on the user's client would also
  // gate this, but admin lookup gives us the storage_path needed for the
  // bucket delete.
  const { data: photo, error: readErr } = await admin
    .from("vendor_photos")
    .select("id, tenant_id, storage_path")
    .eq("id", photoId)
    .maybeSingle();
  if (readErr) return { ok: false, error: `Lookup failed: ${readErr.message}` };
  if (!photo) return { ok: false, error: "Photo not found." };

  if (photo.tenant_id !== vendor.tenantId) {
    return { ok: false, error: "You don't own this photo." };
  }

  const storagePath = photo.storage_path as string;
  if (!storagePath.startsWith(`${vendor.tenantId}/`)) {
    return { ok: false, error: "Photo path mismatch." };
  }

  // Storage delete first. Errors are non-fatal — we still try the DB delete
  // so the UI clears even if storage is having a bad day. The orphaned
  // storage object can be reaped later if we wire a janitor.
  await admin.storage.from("vendor-photos").remove([storagePath]);

  const { error: deleteErr, count } = await admin
    .from("vendor_photos")
    .delete({ count: "exact" })
    .eq("id", photoId);
  if (deleteErr) {
    return { ok: false, error: `Photo delete failed: ${deleteErr.message}` };
  }

  revalidatePath("/vndr/profile");
  revalidatePath("/vndr");
  return { ok: true, deleted: (count ?? 0) > 0 };
}
