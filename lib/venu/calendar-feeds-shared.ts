/**
 * Client-safe types for venue_calendar_feeds (mig 067) + sync state.
 * Per Hard Rule #10 — types live here, server reads + worker layer live in
 * calendar-feeds.ts (server-only).
 */

import type { SourceSystemOption } from "./availability-shared";

export type SourceSystem = SourceSystemOption["id"];

export type CalendarFeed = {
  id: string;
  venueTenantId: string;
  venueSpaceId: string | null;
  feedUrl: string;
  feedLabel: string;
  sourceSystem: SourceSystem | null;
  lastSyncedAt: string | null;
  lastSyncedEventCount: number | null;
  lastError: string | null;
  lastErrorAt: string | null;
  syncPaused: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type FeedSyncSummary = {
  feedId: string;
  ok: boolean;
  inserted: number;
  unchanged: number;
  deleted: number;
  skippedManualWins: number;
  error: string | null;
};
