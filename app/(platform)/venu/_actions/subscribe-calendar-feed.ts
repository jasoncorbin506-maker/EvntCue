"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import { fetchIcalText } from "@/lib/venu/ical-parse";
import { shapeFeed, FEED_COLS_SQL } from "@/lib/venu/calendar-feeds";
import { syncFeed } from "@/lib/venu/sync-feed";
import type { SourceSystem } from "@/lib/venu/calendar-feeds-shared";

/**
 * Subscribe to an iCal feed for the signed-in venue. Validates that the URL
 * returns parseable iCal content BEFORE the insert lands, so the operator
 * sees a clear error instead of an orphaned row with last_error set.
 *
 * On success: inserts the venue_calendar_feeds row + triggers an immediate
 * first sync (don't make the operator wait an hour for the worker tick to
 * see whether the feed works). The first-sync writes the initial set of
 * ical blocks; subsequent hourly polls keep them in sync.
 */

export type SubscribeInput = {
  feedUrl: string;
  feedLabel: string;
  sourceSystem: SourceSystem | null;
  venueSpaceId: string | null;
};

export type SubscribeResult =
  | { ok: true; feedId: string; eventCount: number }
  | { ok: false; error: string };

export async function subscribeCalendarFeed(
  input: SubscribeInput,
): Promise<SubscribeResult> {
  const url = input.feedUrl.trim();
  const label = input.feedLabel.trim();
  if (!url) return { ok: false, error: "Paste a calendar link to subscribe." };
  if (!label) return { ok: false, error: "Give the calendar a short label." };

  // Validate fetch BEFORE we insert. Cheap pre-check; if the URL is bogus
  // we get a clean inline error instead of a phantom feed row.
  const fetched = await fetchIcalText(url);
  if (!fetched.ok) return { ok: false, error: fetched.error };

  const venue = await getCurrentVenue();
  if (!venue) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: feedRow, error: insErr } = await supabase
    .from("venue_calendar_feeds")
    .insert({
      venue_tenant_id: venue.tenantId,
      venue_space_id: input.venueSpaceId,
      feed_url: url,
      feed_label: label,
      source_system: input.sourceSystem,
      created_by: user.id,
    })
    .select(FEED_COLS_SQL)
    .single();

  if (insErr || !feedRow) {
    // dedup unique index fires here if the operator pastes the same URL twice
    // for the same (venue, space) slot.
    const msg = insErr?.message ?? "Subscribe failed.";
    if (msg.includes("idx_vcf_dedup")) {
      return { ok: false, error: "You've already subscribed to that calendar for this space." };
    }
    return { ok: false, error: msg };
  }

  const feed = shapeFeed(feedRow as Record<string, unknown>);

  // First-sync — use the authed client so the operator's own RLS scope writes
  // the blocks (their own venue_tenant_id is the only one accessible).
  const summary = await syncFeed(feed, supabase);

  revalidatePath("/venu/availability");
  revalidatePath("/venu/discover");
  return {
    ok: true,
    feedId: feed.id,
    eventCount: summary.inserted + summary.unchanged,
  };
}
