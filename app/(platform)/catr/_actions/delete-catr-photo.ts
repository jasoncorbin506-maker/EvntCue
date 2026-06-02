"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentCaterer } from "@/lib/catr/current-caterer";

/**
 * Delete a caterer portfolio photo (Lock 30 catr tail) — removes the storage
 * object + the catr_photos row. Ownership is enforced by matching tenant_id to
 * the current caterer before deleting (admin client bypasses RLS, so the check
 * is explicit). Mirrors delete-venue-photo.ts.
 */
export type DeleteCatrPhotoResult = { ok: true } | { ok: false; error: string };

export async function deleteCatrPhoto(photoId: string): Promise<DeleteCatrPhotoResult> {
  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };
  if (!photoId) return { ok: false, error: "Missing photo id." };

  const admin = createAdminClient();

  const { data: photo } = await admin
    .from("catr_photos")
    .select("id, tenant_id, storage_path")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo || (photo.tenant_id as string) !== caterer.tenantId) {
    return { ok: false, error: "Photo not found." };
  }

  await admin.storage.from("catr-photos").remove([photo.storage_path as string]);
  const { error } = await admin.from("catr_photos").delete().eq("id", photoId);
  if (error) return { ok: false, error: `Couldn't remove the photo: ${error.message}` };

  revalidatePath("/catr/profile");
  revalidatePath("/catr");
  return { ok: true };
}
