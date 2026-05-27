"use client";

import { useState, useTransition } from "react";
import { subscribeCalendarFeed } from "../../_actions/subscribe-calendar-feed";
import {
  SOURCE_SYSTEM_OPTIONS,
  type SourceSystemOption,
  type VenueSpace,
} from "@/lib/venu/availability-shared";
import s from "./SubscribeCalendarFeedSheet.module.css";

type Props = {
  spaces: VenueSpace[];
  onClose: () => void;
};

function instructionFor(id: SourceSystemOption["id"]): string {
  switch (id) {
    case "google":
      return "In Google Calendar → Settings → Settings for my calendars → pick the calendar → Integrate calendar → copy 'Secret address in iCal format'.";
    case "honeybook":
      return "Honeybook → Calendar → Calendar sync → copy the iCal subscription URL.";
    case "tripleseat":
      return "Tripleseat → Settings → Calendar Feeds → generate or copy the iCal URL for the room/property.";
    case "aisle_planner":
      return "Aisle Planner → Account → Calendar Sync → copy the iCal feed URL.";
    case "caterease":
      return "Caterease → Calendar Subscribe → copy the .ics URL for the kitchen/staff.";
    case "other":
      return "Paste any iCal (.ics) subscription URL.";
  }
}

export function SubscribeCalendarFeedSheet({ spaces, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [sourceSystem, setSourceSystem] = useState<SourceSystemOption["id"]>("google");
  const [feedUrl, setFeedUrl] = useState("");
  const [feedLabel, setFeedLabel] = useState("");
  const [spaceId, setSpaceId] = useState<string | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await subscribeCalendarFeed({
        feedUrl,
        feedLabel: feedLabel.trim() || sourceSystemLabel(sourceSystem),
        sourceSystem,
        venueSpaceId: spaceId === "" ? null : spaceId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(
        res.eventCount === 0
          ? "Subscribed — no upcoming events found."
          : `Subscribed — ${res.eventCount} ${res.eventCount === 1 ? "event" : "events"} synced.`,
      );
      // Brief pause so the success line is readable before the sheet closes.
      setTimeout(onClose, 1500);
    });
  }

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label="Connect a calendar">
        <div className={s.header}>
          <div>
            <div className={s.title}>Connect a calendar</div>
            <div className={s.subtitle}>Mirror your existing bookings here automatically</div>
          </div>
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={s.sectionLbl}>Where is this calendar from?</div>
        <div className={s.chipRow}>
          {SOURCE_SYSTEM_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`${s.chip} ${sourceSystem === opt.id ? s.chipOn : ""}`}
              onClick={() => setSourceSystem(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className={s.instructions}>{instructionFor(sourceSystem)}</div>

        <div className={s.fieldRow}>
          <label className={s.fieldLbl} htmlFor="feed-url">
            Calendar link
          </label>
          <input
            id="feed-url"
            type="url"
            className={s.input}
            placeholder="https:// or webcal://…"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={s.fieldRow}>
          <label className={s.fieldLbl} htmlFor="feed-label">
            Label
          </label>
          <input
            id="feed-label"
            type="text"
            className={s.input}
            placeholder={`e.g., Main Ballroom — ${sourceSystemLabel(sourceSystem)}`}
            value={feedLabel}
            onChange={(e) => setFeedLabel(e.target.value)}
          />
        </div>

        {spaces.length > 1 && (
          <div className={s.fieldRow}>
            <label className={s.fieldLbl} htmlFor="feed-space">
              Space
            </label>
            <select
              id="feed-space"
              className={s.input}
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
            >
              <option value="">Whole venue</option>
              {spaces.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <div className={s.errMsg}>{error}</div>}
        {success && <div className={s.okMsg}>{success}</div>}

        <div className={s.footer}>
          <button type="button" className={s.btn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={handleSubmit}
            disabled={pending}
          >
            {pending ? "Connecting…" : "Subscribe"}
          </button>
        </div>
      </div>
    </>
  );
}

function sourceSystemLabel(id: SourceSystemOption["id"]): string {
  return SOURCE_SYSTEM_OPTIONS.find((o) => o.id === id)?.label ?? "Calendar";
}
