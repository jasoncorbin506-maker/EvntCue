"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * V-2b Session B: receive a portfolio photo File from the Profile tab,
 * validate, upload to the `vendor-photos` bucket (migration 056), insert
 * a vendor_photos row, return enough metadata for the client to render
 * the new photo immediately.
 *
 * Auth: createClient() resolves the user. Admin client used for storage +
 * DB writes (matches mood-board uploadImageAction pattern from session 18).
 * The vendor's authed identity is stamped into vendor_photos.created_by
 * regardless of which client runs the SQL — provenance preserved.
 *
 * Path convention: `${tenant_id}/${randomUUID()}.${ext}`. Tenant prefix
 * matches the moodboard bucket convention and simplifies future cleanup.
 *
 * Cap: 12 photos per vendor for V-2b. Hard error if at cap; client should
 * hide the upload button when len === 12 but the action defends too.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS_PER_VENDOR = 12;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: "Image must be JPEG, PNG, or WEBP." };
  }

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

  const ext = MIME_TO_EXT[file.type] ?? "bin";
  const storagePath = `${vendor.tenantId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await admin.storage
    .from("vendor-photos")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadErr) {
    return { ok: false, error: `Upload failed: ${uploadErr.message}` };
  }

  const { data: row, error: insertErr } = await admin
    .from("vendor_photos")
    .insert({
      tenant_id: vendor.tenantId,
      storage_path: storagePath,
      display_order: existingCount ?? 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    // Best-effort cleanup of the storage object if the DB insert failed.
    await admin.storage.from("vendor-photos").remove([storagePath]);
    return {
      ok: false,
      error: `Photo insert failed: ${insertErr?.message ?? "unknown"}`,
    };
  }

  const { data: pub } = admin.storage
    .from("vendor-photos")
    .getPublicUrl(storagePath);

  revalidatePath("/vndr/profile");
  revalidatePath("/vndr");

  return {
    ok: true,
    photo: {
      id: row.id as string,
      storagePath,
      publicUrl: pub.publicUrl,
    },
  };
}
