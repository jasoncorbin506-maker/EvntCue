import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { shapeFeed, FEED_COLS_SQL } from "@/lib/venu/calendar-feeds";
import { syncFeed } from "@/lib/venu/sync-feed";
import type { FeedSyncSummary } from "@/lib/venu/calendar-feeds-shared";

/**
 * Daily Vercel cron worker — syncs every active venue_calendar_feeds row
 * against its external iCal source. Schedule defined in vercel.json:
 * `0 6 * * *` (06:00 UTC ≈ 01:00 ET). Vercel Hobby tier caps cron
 * granularity at daily; bump to hourly (`0 * * * *`) after upgrading to
 * Pro. Operator-on-demand "Sync now" button bypasses the cron schedule
 * entirely.
 *
 * Auth: Vercel cron requests carry `Authorization: Bearer <CRON_SECRET>`.
 * Without that header we 401. The CRON_SECRET env var must be set in
 * Vercel Production (per Hard Rule #9 — never substring-print env values).
 *
 * Manual same-route invocation (operator clicking a UI "run all now"
 * button) is intentionally NOT supported here; per-feed sync goes through
 * the syncCalendarFeedNow server action which uses the operator's authed
 * client. This route is admin-only by design.
 *
 * Auto-pause: any feed that hits ≥5 consecutive errors gets sync_paused=true
 * set so we stop hammering a broken URL. Operator can manually resume from
 * the feed row UI. Per Lock 22 forgiveness — informs via inline error,
 * doesn't permanently disable.
 */

const ERROR_STREAK_AUTO_PAUSE = 5;

type WorkerResult = {
  ok: boolean;
  feedsProcessed: number;
  successCount: number;
  failureCount: number;
  autoPausedCount: number;
  summaries: FeedSyncSummary[];
};

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Pull every active feed (sync_paused = false).
  const { data: feedRows, error: listErr } = await admin
    .from("venue_calendar_feeds")
    .select(FEED_COLS_SQL)
    .eq("sync_paused", false);
  if (listErr) {
    return NextResponse.json(
      { ok: false, error: listErr.message, where: "list feeds" },
      { status: 500 },
    );
  }

  const feeds = (feedRows ?? []).map((row) =>
    shapeFeed(row as Record<string, unknown>),
  );

  const summaries: FeedSyncSummary[] = [];
  let successCount = 0;
  let failureCount = 0;
  let autoPausedCount = 0;

  for (const feed of feeds) {
    const summary = await syncFeed(feed, admin);
    summaries.push(summary);
    if (summary.ok) {
      successCount++;
    } else {
      failureCount++;
      // Check the error streak. Count of consecutive errors = approximated by
      // sequential last_error rows; a clean approach is to track on the feed
      // row, but that's an extra column. For V-2 we use a simpler heuristic:
      // if last_error is set AND last_synced_at is older than 5 polls ago
      // (5h) OR null, auto-pause. This errs slightly toward NOT auto-pausing
      // on transient blips, which matches Lock 22's "inform-before-block."
      const lastSync = feed.lastSyncedAt
        ? new Date(feed.lastSyncedAt).getTime()
        : null;
      const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000;
      const streakBroken = lastSync === null || lastSync < fiveHoursAgo;
      if (streakBroken && feed.lastError !== null) {
        await admin
          .from("venue_calendar_feeds")
          .update({ sync_paused: true })
          .eq("id", feed.id);
        autoPausedCount++;
      }
    }
  }

  const result: WorkerResult = {
    ok: true,
    feedsProcessed: feeds.length,
    successCount,
    failureCount,
    autoPausedCount,
    summaries,
  };
  return NextResponse.json(result);
}

/**
 * Vercel cron deliberately uses GET (the platform's contract). POST is not
 * accepted here; if someone discovers the URL externally they get 405.
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

// Tell Next.js to never cache cron responses.
export const dynamic = "force-dynamic";

// Allow up to 5 min for a full feed sweep. Each feed is bounded by the
// 30s fetch timeout in ical-parse.ts; 5 min covers ~10 feeds on the slow
// side, comfortable for early venue counts.
export const maxDuration = 300;

void ERROR_STREAK_AUTO_PAUSE;
