"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Soft-delete a venue_spaces row by setting status='inactive'. We don't
 * hard-delete because venue_availability_blocks + venue_calendar_feeds
 * cascade from venue_spaces (ON DELETE CASCADE per migs 066/067) — a
 * hard delete would wipe block history operators may still want to
 * audit. Operator can re-activate via the upsert action.
 */

export type ArchiveVenueSpaceResult =
  | { ok: true }
  | { ok: false; error: string };

export async function archiveVenueSpace(
  spaceId: string,
): Promise<ArchiveVenueSpaceResult> {
  if (!spaceId) return { ok: false, error: "Missing space id." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("venue_spaces")
    .update({ status: "inactive" })
    .eq("id", spaceId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/venu/tools/spaces");
  revalidatePath("/venu/availability");
  return { ok: true };
}
