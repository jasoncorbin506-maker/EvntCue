"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import { ingestBytes, extForMime, removeObjects } from "@/lib/media";

/**
 * Venue portfolio photo upload (Lock 30 Phase B). Funnels the file through
 * MediaService (the CSAM-safety chokepoint) — validation (5 MB; jpeg/png/webp),
 * future scan, upload to the public `venue-photos` bucket, public-URL — then
 * inserts a venue_photos row stamped with the uploader's user id.
 */

const MAX_PHOTOS_PER_VENUE = 12;

export type UploadVenuePhotoResult =
  | { ok: true; photo: { id: string; storagePath: string; publicUrl: string } }
  | { ok: false; error: string };

export async function uploadVenuePhoto(
  formData: FormData,
): Promise<UploadVenuePhotoResult> {
  const venue = await getCurrentVenue();
  if (!venue) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };

  const admin = createAdminClient();

  const { count: existingCount, error: countErr } = await admin
    .from("venue_photos")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", venue.tenantId);
  if (countErr) return { ok: false, error: `Photo count lookup failed: ${countErr.message}` };
  if ((existingCount ?? 0) >= MAX_PHOTOS_PER_VENUE) {
    return { ok: false, error: `Up to ${MAX_PHOTOS_PER_VENUE} photos. Remove one to add another.` };
  }

  const objectKey = `${venue.tenantId}/${randomUUID()}.${extForMime(file.type)}`;
  const ingest = await ingestBytes({
    kind: "venue_photo",
    objectKey,
    contentType: file.type,
    bytes: await file.arrayBuffer(),
    tenantId: venue.tenantId,
    uploadedBy: user.id,
  });
  if (!ingest.ok) return { ok: false, error: ingest.error };

  const { data: row, error: insertErr } = await admin
    .from("venue_photos")
    .insert({
      tenant_id: venue.tenantId,
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

  revalidatePath("/venu/photos");
  revalidatePath("/venu");

  return { ok: true, photo: { id: row.id as string, storagePath: ingest.storagePath, publicUrl: ingest.url } };
}
