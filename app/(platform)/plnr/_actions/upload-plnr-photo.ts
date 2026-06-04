"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentPlanner } from "@/lib/plnr/current-planner";

/**
 * Planner portfolio photo upload (Lock 30 Phase C pt 2) — mirrors
 * upload-catr-photo.ts. Uploads to the public `planner-photos` bucket via the
 * admin client (service-role bypasses storage RLS; the bucket is public for
 * reads) and inserts a planner_photos row stamped with the uploader's user id.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS_PER_PLNR = 12;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadPlnrPhotoResult =
  | { ok: true; photo: { id: string; storagePath: string; publicUrl: string } }
  | { ok: false; error: string };

export async function uploadPlnrPhoto(
  formData: FormData,
): Promise<UploadPlnrPhotoResult> {
  const planner = await getCurrentPlanner();
  if (!planner) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Image must be 5 MB or smaller." };
  if (!ALLOWED_MIME.has(file.type)) return { ok: false, error: "Image must be JPEG, PNG, or WEBP." };

  const admin = createAdminClient();

  const { count: existingCount, error: countErr } = await admin
    .from("planner_photos")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", planner.tenantId);
  if (countErr) return { ok: false, error: `Photo count lookup failed: ${countErr.message}` };
  if ((existingCount ?? 0) >= MAX_PHOTOS_PER_PLNR) {
    return { ok: false, error: `Up to ${MAX_PHOTOS_PER_PLNR} photos. Remove one to add another.` };
  }

  const ext = MIME_TO_EXT[file.type] ?? "bin";
  const storagePath = `${planner.tenantId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await admin.storage
    .from("planner-photos")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadErr) return { ok: false, error: `Upload failed: ${uploadErr.message}` };

  const { data: row, error: insertErr } = await admin
    .from("planner_photos")
    .insert({
      tenant_id: planner.tenantId,
      storage_path: storagePath,
      display_order: existingCount ?? 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    await admin.storage.from("planner-photos").remove([storagePath]);
    return { ok: false, error: `Photo insert failed: ${insertErr?.message ?? "unknown"}` };
  }

  const { data: pub } = admin.storage.from("planner-photos").getPublicUrl(storagePath);
  revalidatePath("/plnr/profile");
  revalidatePath("/plnr");

  return { ok: true, photo: { id: row.id as string, storagePath, publicUrl: pub.publicUrl } };
}
