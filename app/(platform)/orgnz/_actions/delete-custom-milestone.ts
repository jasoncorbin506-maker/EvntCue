"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Delete a user-authored milestone. The seed-milestone equivalent is the
 * "dismissed" status on events.milestone_overrides — see updateSeedMilestone.
 *
 * Custom milestones added from the cultural traditions picker delete the
 * same way: the picker can re-add them later (and the user can free-text
 * a different version if they want).
 */
export async function deleteCustomMilestone(input: {
  id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.id) return { ok: false, error: "Missing id" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_custom_milestones")
    .delete()
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/orgnz");
  return { ok: true };
}
