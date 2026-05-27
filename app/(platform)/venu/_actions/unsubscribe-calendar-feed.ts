"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Unsubscribe from an iCal feed. Deletes the feed row; CASCADE on
 * venue_calendar_feeds(id) does NOT clear the historical blocks (the back-edge
 * FK is ON DELETE SET NULL per mig 067, preserving operator-visible history).
 * Instead we follow the brief's explicit unsubscribe-cleans-blocks behavior
 * by deleting the ical blocks for this feed_id BEFORE deleting the feed.
 *
 * If the operator wants the blocks to survive as orphans, they can pause
 * the feed instead.
 */

export type UnsubscribeResult =
  | { ok: true; deletedBlocks: number }
  | { ok: false; error: string };

export async function unsubscribeCalendarFeed(
  feedId: string,
): Promise<UnsubscribeResult> {
  if (!feedId) return { ok: false, error: "Missing feed id." };
  const supabase = await createClient();

  // Delete the ical blocks first. RLS scopes this to the operator's own
  // tenant; cross-tenant ids harmlessly return zero rows.
  const { error: blockDelErr, count: blockCount } = await supabase
    .from("venue_availability_blocks")
    .delete({ count: "exact" })
    .eq("source_feed_id", feedId);
  if (blockDelErr) return { ok: false, error: blockDelErr.message };

  const { error: feedDelErr } = await supabase
    .from("venue_calendar_feeds")
    .delete()
    .eq("id", feedId);
  if (feedDelErr) return { ok: false, error: feedDelErr.message };

  revalidatePath("/venu/availability");
  revalidatePath("/venu/discover");
  return { ok: true, deletedBlocks: blockCount ?? 0 };
}
