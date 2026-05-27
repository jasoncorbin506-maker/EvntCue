import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CalendarFeed } from "./calendar-feeds-shared";
import type { SourceSystem } from "./calendar-feeds-shared";

/**
 * Server reads for venue_calendar_feeds (mig 067). RLS-scoped via the
 * vcf_* policies; caller must be authed for SELECT to return rows.
 *
 * Cron worker uses createAdminClient() in the route handler (no auth
 * context), bypassing RLS — see app/api/cron/sync-calendar-feeds/route.ts.
 */

const FEED_COLS =
  "id, venue_tenant_id, venue_space_id, feed_url, feed_label, source_system, last_synced_at, last_synced_event_count, last_error, last_error_at, sync_paused, created_by, created_at, updated_at";

export function shapeFeed(row: Record<string, unknown>): CalendarFeed {
  return {
    id: row.id as string,
    venueTenantId: row.venue_tenant_id as string,
    venueSpaceId: (row.venue_space_id as string | null) ?? null,
    feedUrl: row.feed_url as string,
    feedLabel: row.feed_label as string,
    sourceSystem: (row.source_system as SourceSystem | null) ?? null,
    lastSyncedAt: (row.last_synced_at as string | null) ?? null,
    lastSyncedEventCount: (row.last_synced_event_count as number | null) ?? null,
    lastError: (row.last_error as string | null) ?? null,
    lastErrorAt: (row.last_error_at as string | null) ?? null,
    syncPaused: row.sync_paused as boolean,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const FEED_COLS_SQL = FEED_COLS;

export async function getCalendarFeeds(
  venueTenantId: string,
): Promise<CalendarFeed[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_calendar_feeds")
    .select(FEED_COLS)
    .eq("venue_tenant_id", venueTenantId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((row) => shapeFeed(row as Record<string, unknown>));
}

export async function getCalendarFeedById(
  feedId: string,
): Promise<CalendarFeed | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_calendar_feeds")
    .select(FEED_COLS)
    .eq("id", feedId)
    .maybeSingle();
  if (!data) return null;
  return shapeFeed(data as Record<string, unknown>);
}
