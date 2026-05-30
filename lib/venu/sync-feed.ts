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
 * 3. Read this feed's existing ical blocks once; skip events already present
 *    (dedup key = blocked_date + UID) and plain-insert the remainder. We do
 *    NOT use upsert/onConflict because idx_vab_dedup is a COALESCE expression
 *    index PostgREST cannot target. Counts new inserts vs unchanged rows.
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

  // Read this feed's existing ical blocks ONCE — reused for both the Step 2
  // dedup pre-filter and the Step 3 vanished-UID delete. idx_vab_dedup is a
  // COALESCE *expression* unique index, which supabase-js .upsert({onConflict})
  // cannot target (PostgREST can't infer expression indexes — it throws 42P10
  // "no unique or exclusion constraint matching the ON CONFLICT specification").
  // So we skip events already present and plain-insert only the remainder; the
  // unique index stays the backstop against a concurrent double-sync (23505).
  const { data: existingIcalBlocks } = await client
    .from("venue_availability_blocks")
    .select("id, source_ref, blocked_date")
    .eq("source_feed_id", feed.id);
  const existingRows = (existingIcalBlocks ?? []) as Array<Record<string, unknown>>;

  // Dedup natural key: blocked_date + UID. A recurring event shares ONE UID
  // across many dates, so UID alone would wrongly collapse a series — the date
  // must be part of the key.
  const existingKeys = new Set(
    existingRows.map(
      (r) => `${r.blocked_date as string}|${(r.source_ref as string | null) ?? ""}`,
    ),
  );

  // Step 2: insert NEW ical blocks. The created_by column is NOT NULL — carry
  // the feed's creator forward as the audit trail.
  let inserted = 0;
  let unchanged = 0;
  if (eventsToWrite.length > 0) {
    const newEvents = eventsToWrite.filter(
      (ev) => !existingKeys.has(`${ev.blockedDate}|${ev.uid}`),
    );
    unchanged = eventsToWrite.length - newEvents.length;

    if (newEvents.length > 0) {
      const rows = newEvents.map((ev) => ({
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
        .insert(rows)
        .select("id");
      if (error) {
        // Treat as an ical-feed-side issue, not a hard failure — update
        // last_error but don't blow away the historical sync state. A 23505
        // here means a concurrent sync beat us to the same rows; that's benign
        // (the rows exist), but we surface it rather than silently swallow.
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
      inserted = data?.length ?? 0;
    }
  }

  // Step 3: hard-delete vanished UIDs (events cancelled in the source system).
  // Reuses existingRows read above — no second round-trip.
  const currentUids = new Set(parsed.map((e) => e.uid));
  let deleted = 0;
  if (existingRows.length > 0) {
    const idsToDelete = existingRows
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
