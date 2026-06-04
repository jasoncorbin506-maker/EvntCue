"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentPlanner } from "@/lib/plnr/current-planner";

/**
 * Delete a planner portfolio photo (Lock 30 Phase C pt 2) — removes the storage
 * object + the planner_photos row. Ownership is enforced by matching tenant_id
 * to the current planner before deleting (admin client bypasses RLS, so the
 * check is explicit). Mirrors delete-catr-photo.ts.
 */
export type DeletePlnrPhotoResult = { ok: true } | { ok: false; error: string };

export async function deletePlnrPhoto(photoId: string): Promise<DeletePlnrPhotoResult> {
  const planner = await getCurrentPlanner();
  if (!planner) return { ok: false, error: "Not signed in." };
  if (!photoId) return { ok: false, error: "Missing photo id." };

  const admin = createAdminClient();

  const { data: photo } = await admin
    .from("planner_photos")
    .select("id, tenant_id, storage_path")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo || (photo.tenant_id as string) !== planner.tenantId) {
    return { ok: false, error: "Photo not found." };
  }

  await admin.storage.from("planner-photos").remove([photo.storage_path as string]);
  const { error } = await admin.from("planner_photos").delete().eq("id", photoId);
  if (error) return { ok: false, error: `Couldn't remove the photo: ${error.message}` };

  revalidatePath("/plnr/profile");
  revalidatePath("/plnr");
  return { ok: true };
}
