"use client";

import { useState, useTransition } from "react";
import { syncCalendarFeedNow } from "../../_actions/sync-calendar-feed-now";
import { setCalendarFeedPaused } from "../../_actions/pause-resume-calendar-feed";
import { unsubscribeCalendarFeed } from "../../_actions/unsubscribe-calendar-feed";
import type { CalendarFeed } from "@/lib/venu/calendar-feeds-shared";
import { SOURCE_SYSTEM_OPTIONS } from "@/lib/venu/availability-shared";
import s from "./CalendarFeedRow.module.css";

type Props = {
  feed: CalendarFeed;
  spaceName: string | null;
};

function fmtRelative(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sourceLabel(id: string | null): string {
  if (!id) return "Calendar";
  const opt = SOURCE_SYSTEM_OPTIONS.find((o) => o.id === id);
  return opt?.label ?? "Calendar";
}

export function CalendarFeedRow({ feed, spaceName }: Props) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const [paused, setPaused] = useState(feed.syncPaused);
  const [lastSync, setLastSync] = useState(feed.lastSyncedAt);
  const [lastError, setLastError] = useState(feed.lastError);
  const [eventCount, setEventCount] = useState(feed.lastSyncedEventCount);
  const [opError, setOpError] = useState<string | null>(null);

  if (removed) return null;

  function handleSyncNow() {
    setOpError(null);
    startTransition(async () => {
      const res = await syncCalendarFeedNow(feed.id);
      if (!res.ok) {
        setOpError(res.error);
        return;
      }
      if (res.summary.ok) {
        setLastSync(new Date().toISOString());
        setLastError(null);
        setEventCount(res.summary.inserted + res.summary.unchanged);
      } else {
        setLastError(res.summary.error);
      }
    });
  }

  function handleTogglePause() {
    setOpError(null);
    const next = !paused;
    startTransition(async () => {
      const res = await setCalendarFeedPaused(feed.id, next);
      if (!res.ok) {
        setOpError(res.error);
        return;
      }
      setPaused(next);
    });
  }

  function handleUnsubscribe() {
    setOpError(null);
    if (!confirm(`Unsubscribe from "${feed.feedLabel}"? Synced blocks will be removed.`)) {
      return;
    }
    startTransition(async () => {
      const res = await unsubscribeCalendarFeed(feed.id);
      if (!res.ok) {
        setOpError(res.error);
        return;
      }
      setRemoved(true);
    });
  }

  return (
    <div className={s.row}>
      <div className={s.head}>
        <div className={s.headL}>
          <div className={s.label}>{feed.feedLabel}</div>
          <div className={s.meta}>
            <span>{sourceLabel(feed.sourceSystem)}</span>
            {spaceName && <span className={s.dot}>·</span>}
            {spaceName && <span>{spaceName}</span>}
          </div>
        </div>
        {paused && <span className={s.pausedPill}>Paused</span>}
      </div>

      <div className={s.statusRow}>
        {lastError ? (
          <div className={s.errorLine}>
            Last sync failed: {lastError}
          </div>
        ) : (
          <div className={s.statusLine}>
            Last sync {fmtRelative(lastSync)}
            {eventCount !== null && ` · ${eventCount} ${eventCount === 1 ? "event" : "events"}`}
          </div>
        )}
      </div>

      {opError && <div className={s.errorLine}>{opError}</div>}

      <div className={s.actions}>
        <button
          type="button"
          className={s.actionBtn}
          onClick={handleSyncNow}
          disabled={pending}
        >
          {pending ? "Syncing…" : "Sync now"}
        </button>
        <button
          type="button"
          className={s.actionBtn}
          onClick={handleTogglePause}
          disabled={pending}
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          className={`${s.actionBtn} ${s.danger}`}
          onClick={handleUnsubscribe}
          disabled={pending}
        >
          Unsubscribe
        </button>
      </div>
    </div>
  );
}
