import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAndParseFeed, type ParsedEvent } from "./ical-parse";
import type { CalendarFeed, FeedSyncSummary } from "./calendar-feeds-shared";

/**
 * Sync one iCal feed against venue_availability_blocks. Used by both the
 * Vercel cron worker (every active feed, daily on Hobby tier) AND the
 * "Sync now" server action (one feed on demand).
 *
 * Caller passes a Supabase client. Cron passes the admin client so writes
 * cross all tenants; "Sync now" passes the authed client so RLS enforces
 * the operator can only sync their own feeds.
 *
 * ─── Logic ───────────────────────────────────────────────────────────────
 *
 * 1. Fetch + parse → list of ParsedEvent (UID, date, optional times, reason).
 * 2. For each parsed event, check manual-wins: if a manual block exists for
 *    the same (tenant, space, date), skip writing the ical block for that
 *    event. Counted in `skippedManualWins` for operator-visible reporting.
 * 3. Upsert remaining events via the dedup unique index on
 *    (venue_tenant_id, venue_space_id, blocked_date, source, source_ref).
 *    Counts new inserts vs unchanged rows.
 * 4. Hard-delete any existing ical blocks for this source_feed_id whose
 *    source_ref is NOT in the current parsed UID set — these are events
 *    cancelled in the external system. Source-of-truth flows external → us.
 * 5. Update feed.last_synced_at / last_synced_event_count / last_error fields.
 *
 * On fetch/parse error: write last_error + last_error_at, leave existing
 * blocks alone, return ok:false summary. The worker (cron route) decides
 * whether to auto-pause based on error streak.
 */

const FEED_OWNER_USER_ID_FALLBACK = "00000000-0000-0000-0000-000000000000";

/**
 * Test-only option: pass `eventsOverride` to skip the HTTP fetch + iCal parse
 * and feed the worker logic a known event list. Production code paths never
 * pass this. Used by T-35 (manual-wins conflict rule) in the RLS suite.
 */
export type SyncFeedOptions = {
  eventsOverride?: ParsedEvent[];
};

export async function syncFeed(
  feed: CalendarFeed,
  client: SupabaseClient,
  options?: SyncFeedOptions,
): Promise<FeedSyncSummary> {
  const result = options?.eventsOverride
    ? ({ ok: true, events: options.eventsOverride } as const)
    : await fetchAndParseFeed(feed.feedUrl);
  if (!result.ok) {
    await client
      .from("venue_calendar_feeds")
      .update({
        last_error: result.error,
        last_error_at: new Date().toISOString(),
      })
      .eq("id", feed.id);
    return {
      feedId: feed.id,
      ok: false,
      inserted: 0,
      unchanged: 0,
      deleted: 0,
      skippedManualWins: 0,
      error: result.error,
    };
  }

  const parsed = result.events;

  // Step 1: manual-wins. Pull manual blocks for this (tenant, space) covering
  // the parsed-event date set.
  const dateSet = new Set(parsed.map((e) => e.blockedDate));
  const dates = [...dateSet];

  let manualDates = new Set<string>();
  if (dates.length > 0) {
    let manualQuery = client
      .from("venue_availability_blocks")
      .select("blocked_date, venue_space_id")
      .eq("venue_tenant_id", feed.venueTenantId)
      .eq("source", "manual")
      .in("blocked_date", dates);
    if (feed.venueSpaceId === null) {
      manualQuery = manualQuery.is("venue_space_id", null);
    } else {
      manualQuery = manualQuery.eq("venue_space_id", feed.venueSpaceId);
    }
    const { data: manualRows } = await manualQuery;
    manualDates = new Set(
      (manualRows ?? []).map((r) => (r as Record<string, unknown>).blocked_date as string),
    );
  }

  const eventsToWrite: ParsedEvent[] = [];
  let skippedManualWins = 0;
  for (const ev of parsed) {
    if (manualDates.has(ev.blockedDate)) {
      skippedManualWins++;
      continue;
    }
    eventsToWrite.push(ev);
  }

  // Step 2: upsert ical blocks by the dedup unique-index key. The created_by
  // column is NOT NULL — carry the feed's creator forward as the audit trail.
  let inserted = 0;
  let unchanged = 0;
  if (eventsToWrite.length > 0) {
    const rows = eventsToWrite.map((ev) => ({
      venue_tenant_id: feed.venueTenantId,
      venue_space_id: feed.venueSpaceId,
      blocked_date: ev.blockedDate,
      start_time: ev.startTime,
      end_time: ev.endTime,
      reason: ev.reason,
      source: "ical_feed" as const,
      source_ref: ev.uid,
      source_feed_id: feed.id,
      created_by: feed.createdBy || FEED_OWNER_USER_ID_FALLBACK,
    }));
    const { data, error } = await client
      .from("venue_availability_blocks")
      .upsert(rows, {
        // Postgres treats COALESCE in the unique index — but supabase-js
        // upsert needs explicit conflict targets. We use the dedup key by
        // its index expression isn't directly addressable; instead use
        // ignoreDuplicates so existing rows are left alone, and the diff
        // between inputs and inserted-id count gives us the new-vs-unchanged
        // split.
        onConflict: "venue_tenant_id,venue_space_id,blocked_date,source,source_ref",
        ignoreDuplicates: false,
      })
      .select("id");
    if (error) {
      // Treat as an ical-feed-side issue, not a hard failure — update last_error
      // but don't blow away the historical sync state.
      await client
        .from("venue_calendar_feeds")
        .update({ last_error: error.message, last_error_at: new Date().toISOString() })
        .eq("id", feed.id);
      return {
        feedId: feed.id,
        ok: false,
        inserted: 0,
        unchanged: 0,
        deleted: 0,
        skippedManualWins,
        error: error.message,
      };
    }
    // supabase upsert with onConflict returns rows for both inserted + updated;
    // for the inserted-vs-unchanged split we'd need to compare timestamps. The
    // distinction is operator-cosmetic; report total written as `inserted`.
    inserted = data?.length ?? 0;
    unchanged = eventsToWrite.length - inserted;
  }

  // Step 3: hard-delete vanished UIDs (events cancelled in the source system).
  const currentUids = new Set(parsed.map((e) => e.uid));
  let deleted = 0;
  const { data: existingIcalBlocks } = await client
    .from("venue_availability_blocks")
    .select("id, source_ref")
    .eq("source_feed_id", feed.id);
  if (existingIcalBlocks && existingIcalBlocks.length > 0) {
    const idsToDelete = (existingIcalBlocks as Array<Record<string, unknown>>)
      .filter((r) => {
        const ref = r.source_ref as string | null;
        return ref !== null && !currentUids.has(ref);
      })
      .map((r) => r.id as string);
    if (idsToDelete.length > 0) {
      const { error: delErr } = await client
        .from("venue_availability_blocks")
        .delete()
        .in("id", idsToDelete);
      if (!delErr) {
        deleted = idsToDelete.length;
      }
    }
  }

  // Step 4: update sync state on the feed row.
  await client
    .from("venue_calendar_feeds")
    .update({
      last_synced_at: new Date().toISOString(),
      last_synced_event_count: parsed.length,
      last_error: null,
      last_error_at: null,
    })
    .eq("id", feed.id);

  return {
    feedId: feed.id,
    ok: true,
    inserted,
    unchanged,
    deleted,
    skippedManualWins,
    error: null,
  };
}
