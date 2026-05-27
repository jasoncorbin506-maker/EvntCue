"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCalendarFeedById } from "@/lib/venu/calendar-feeds";
import { syncFeed } from "@/lib/venu/sync-feed";
import type { FeedSyncSummary } from "@/lib/venu/calendar-feeds-shared";

/**
 * Manual "Sync now" trigger. Operator-visible affordance on each feed row.
 * Runs the same sync logic the hourly cron uses, just on demand for one
 * feed. RLS-scoped via the authed client.
 */

export type SyncNowResult =
  | { ok: true; summary: FeedSyncSummary }
  | { ok: false; error: string };

export async function syncCalendarFeedNow(
  feedId: string,
): Promise<SyncNowResult> {
  if (!feedId) return { ok: false, error: "Missing feed id." };
  const feed = await getCalendarFeedById(feedId);
  if (!feed) return { ok: false, error: "Calendar not found." };

  const supabase = await createClient();
  const summary = await syncFeed(feed, supabase);
  revalidatePath("/venu/availability");
  revalidatePath("/venu/discover");
  return { ok: true, summary };
}
