"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentCaterer } from "@/lib/catr/current-caterer";

/**
 * Caterer portfolio photo upload (Lock 30 catr tail) — mirrors
 * upload-venue-photo.ts. Uploads to the public `catr-photos` bucket via the
 * admin client (service-role bypasses storage RLS; the bucket is public for
 * reads) and inserts a catr_photos row stamped with the uploader's user id.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS_PER_CATR = 12;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadCatrPhotoResult =
  | { ok: true; photo: { id: string; storagePath: string; publicUrl: string } }
  | { ok: false; error: string };

export async function uploadCatrPhoto(
  formData: FormData,
): Promise<UploadCatrPhotoResult> {
  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Image must be 5 MB or smaller." };
  if (!ALLOWED_MIME.has(file.type)) return { ok: false, error: "Image must be JPEG, PNG, or WEBP." };

  const admin = createAdminClient();

  const { count: existingCount, error: countErr } = await admin
    .from("catr_photos")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", caterer.tenantId);
  if (countErr) return { ok: false, error: `Photo count lookup failed: ${countErr.message}` };
  if ((existingCount ?? 0) >= MAX_PHOTOS_PER_CATR) {
    return { ok: false, error: `Up to ${MAX_PHOTOS_PER_CATR} photos. Remove one to add another.` };
  }

  const ext = MIME_TO_EXT[file.type] ?? "bin";
  const storagePath = `${caterer.tenantId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await admin.storage
    .from("catr-photos")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadErr) return { ok: false, error: `Upload failed: ${uploadErr.message}` };

  const { data: row, error: insertErr } = await admin
    .from("catr_photos")
    .insert({
      tenant_id: caterer.tenantId,
      storage_path: storagePath,
      display_order: existingCount ?? 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    await admin.storage.from("catr-photos").remove([storagePath]);
    return { ok: false, error: `Photo insert failed: ${insertErr?.message ?? "unknown"}` };
  }

  const { data: pub } = admin.storage.from("catr-photos").getPublicUrl(storagePath);
  revalidatePath("/catr/profile");
  revalidatePath("/catr");

  return { ok: true, photo: { id: row.id as string, storagePath, publicUrl: pub.publicUrl } };
}
