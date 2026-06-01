"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentVenue } from "@/lib/venu/current-venue";

/**
 * Delete a venue portfolio photo (Lock 30 Phase B) — removes the storage object
 * + the venue_photos row. Ownership is enforced by matching tenant_id to the
 * current venue before deleting (admin client bypasses RLS, so the check is
 * explicit).
 */
export type DeleteVenuePhotoResult = { ok: true } | { ok: false; error: string };

export async function deleteVenuePhoto(photoId: string): Promise<DeleteVenuePhotoResult> {
  const venue = await getCurrentVenue();
  if (!venue) return { ok: false, error: "Not signed in." };
  if (!photoId) return { ok: false, error: "Missing photo id." };

  const admin = createAdminClient();

  const { data: photo } = await admin
    .from("venue_photos")
    .select("id, tenant_id, storage_path")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo || (photo.tenant_id as string) !== venue.tenantId) {
    return { ok: false, error: "Photo not found." };
  }

  await admin.storage.from("venue-photos").remove([photo.storage_path as string]);
  const { error } = await admin.from("venue_photos").delete().eq("id", photoId);
  if (error) return { ok: false, error: `Couldn't remove the photo: ${error.message}` };

  revalidatePath("/venu/photos");
  revalidatePath("/venu");
  return { ok: true };
}
