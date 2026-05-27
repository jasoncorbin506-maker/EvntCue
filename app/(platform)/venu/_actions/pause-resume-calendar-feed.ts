"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Toggle the sync_paused flag on a feed. Per Lock 22 forgiveness pattern,
 * pausing is reversible — operator can resume any time. Auto-pause logic
 * (5+ consecutive errors) is handled by the cron worker, not this action.
 */

export type PauseResumeResult =
  | { ok: true; paused: boolean }
  | { ok: false; error: string };

export async function setCalendarFeedPaused(
  feedId: string,
  paused: boolean,
): Promise<PauseResumeResult> {
  if (!feedId) return { ok: false, error: "Missing feed id." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("venue_calendar_feeds")
    .update({ sync_paused: paused })
    .eq("id", feedId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/venu/availability");
  return { ok: true, paused };
}
