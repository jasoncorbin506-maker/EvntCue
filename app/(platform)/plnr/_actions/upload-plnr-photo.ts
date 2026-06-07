"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentPlanner } from "@/lib/plnr/current-planner";
import { ingestBytes, extForMime, removeObjects } from "@/lib/media";

/**
 * Planner portfolio photo upload (Lock 30 Phase C pt 2). Funnels the file
 * through MediaService (the CSAM-safety chokepoint) — validation (5 MB;
 * jpeg/png/webp), future scan, upload to the public `planner-photos` bucket,
 * public-URL — then inserts a planner_photos row stamped with the uploader.
 */

const MAX_PHOTOS_PER_PLNR = 12;

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

  const admin = createAdminClient();

  const { count: existingCount, error: countErr } = await admin
    .from("planner_photos")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", planner.tenantId);
  if (countErr) return { ok: false, error: `Photo count lookup failed: ${countErr.message}` };
  if ((existingCount ?? 0) >= MAX_PHOTOS_PER_PLNR) {
    return { ok: false, error: `Up to ${MAX_PHOTOS_PER_PLNR} photos. Remove one to add another.` };
  }

  const objectKey = `${planner.tenantId}/${randomUUID()}.${extForMime(file.type)}`;
  const ingest = await ingestBytes({
    kind: "planner_photo",
    objectKey,
    contentType: file.type,
    bytes: await file.arrayBuffer(),
    tenantId: planner.tenantId,
    uploadedBy: user.id,
  });
  if (!ingest.ok) return { ok: false, error: ingest.error };

  const { data: row, error: insertErr } = await admin
    .from("planner_photos")
    .insert({
      tenant_id: planner.tenantId,
      storage_path: ingest.storagePath,
      display_order: existingCount ?? 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    await removeObjects(ingest.bucket, [ingest.storagePath]);
    return { ok: false, error: `Photo insert failed: ${insertErr?.message ?? "unknown"}` };
  }

  revalidatePath("/plnr/profile");
  revalidatePath("/plnr");

  return { ok: true, photo: { id: row.id as string, storagePath: ingest.storagePath, publicUrl: ingest.url } };
}
