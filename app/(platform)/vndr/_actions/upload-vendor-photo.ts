"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { ingestBytes, extForMime, removeObjects } from "@/lib/media";

/**
 * V-2b Session B: receive a portfolio photo File from the Profile tab and
 * funnel it through MediaService (the CSAM-safety chokepoint), then insert a
 * vendor_photos row.
 *
 * MediaService owns validation (5 MB; jpeg/png/webp), the future scan, the
 * storage upload to `vendor-photos`, and public-URL resolution. This action
 * owns auth, the 12-photo cap, the DB row (provenance stamped via created_by),
 * and cleanup-on-insert-failure.
 *
 * Path convention preserved: `${tenant_id}/${randomUUID()}.${ext}`.
 */

const MAX_PHOTOS_PER_VENDOR = 12;

export type UploadVendorPhotoResult =
  | { ok: true; photo: { id: string; storagePath: string; publicUrl: string } }
  | { ok: false; error: string };

export async function uploadVendorPhoto(
  formData: FormData,
): Promise<UploadVendorPhotoResult> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };

  const admin = createAdminClient();

  // Cap check — bounded by tenant.
  const { count: existingCount, error: countErr } = await admin
    .from("vendor_photos")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", vendor.tenantId);
  if (countErr) {
    return { ok: false, error: `Photo count lookup failed: ${countErr.message}` };
  }
  if ((existingCount ?? 0) >= MAX_PHOTOS_PER_VENDOR) {
    return {
      ok: false,
      error: `Up to ${MAX_PHOTOS_PER_VENDOR} photos. Remove one to add another.`,
    };
  }

  const objectKey = `${vendor.tenantId}/${randomUUID()}.${extForMime(file.type)}`;
  const ingest = await ingestBytes({
    kind: "vendor_photo",
    objectKey,
    contentType: file.type,
    bytes: await file.arrayBuffer(),
    tenantId: vendor.tenantId,
    uploadedBy: user.id,
  });
  if (!ingest.ok) return { ok: false, error: ingest.error };

  const { data: row, error: insertErr } = await admin
    .from("vendor_photos")
    .insert({
      tenant_id: vendor.tenantId,
      storage_path: ingest.storagePath,
      display_order: existingCount ?? 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    // Best-effort cleanup of the storage object if the DB insert failed.
    await removeObjects(ingest.bucket, [ingest.storagePath]);
    return {
      ok: false,
      error: `Photo insert failed: ${insertErr?.message ?? "unknown"}`,
    };
  }

  revalidatePath("/vndr/profile");
  revalidatePath("/vndr");

  return {
    ok: true,
    photo: {
      id: row.id as string,
      storagePath: ingest.storagePath,
      publicUrl: ingest.url,
    },
  };
}
