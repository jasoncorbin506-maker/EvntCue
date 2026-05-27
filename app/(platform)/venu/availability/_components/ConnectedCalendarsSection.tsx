"use client";

import { useState } from "react";
import { SubscribeCalendarFeedSheet } from "./SubscribeCalendarFeedSheet";
import { CalendarFeedRow } from "./CalendarFeedRow";
import type { CalendarFeed } from "@/lib/venu/calendar-feeds-shared";
import type { VenueSpace } from "@/lib/venu/availability-shared";
import s from "./ConnectedCalendarsSection.module.css";

type Props = {
  feeds: CalendarFeed[];
  spaces: VenueSpace[];
};

export function ConnectedCalendarsSection({ feeds, spaces }: Props) {
  const [open, setOpen] = useState(false);
  const spaceNameById = new Map(spaces.map((sp) => [sp.id, sp.name]));

  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>Connected calendars</h2>
        <button
          type="button"
          className={s.subscribeBtn}
          onClick={() => setOpen(true)}
        >
          + Connect
        </button>
      </div>
      <p className={s.sectionHint}>
        Subscribe to a calendar from your booking system and we&apos;ll mirror
        the dates here automatically. Add as many as you need — one per space
        or one shared.
      </p>

      {feeds.length === 0 ? (
        <div className={s.emptyState}>
          No calendars connected yet. Tap <b>Connect</b> to subscribe to a
          calendar from Google, Honeybook, Tripleseat, Aisle Planner, or
          Caterease.
        </div>
      ) : (
        <div className={s.feedList}>
          {feeds.map((feed) => (
            <CalendarFeedRow
              key={feed.id}
              feed={feed}
              spaceName={
                feed.venueSpaceId
                  ? (spaceNameById.get(feed.venueSpaceId) ?? "Unknown space")
                  : null
              }
            />
          ))}
        </div>
      )}

      {open && (
        <SubscribeCalendarFeedSheet
          spaces={spaces}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}
