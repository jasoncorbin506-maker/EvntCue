"use client";

import { useState, useTransition } from "react";
import { createAvailabilityBlock } from "../../_actions/create-availability-block";
import type { VenueSpace } from "@/lib/venu/availability-shared";
import s from "./AvailabilityBlockSheet.module.css";

/**
 * Bottom sheet for adding a new manual availability block. Mirrors the
 * vendor-side sheet from V-2b (app/(platform)/vndr/_components/
 * AvailabilityBlockSheet.tsx) but adds two venue-only affordances:
 *
 *   1. Date picker — vendor sheet was opened from a calendar cell so the
 *      date was given; venue page has no grid (Venu lock 2026-05-13 forbids
 *      one on mobile), so the operator picks a date inside the sheet.
 *   2. Space picker — venues can have multiple spaces (Main Ballroom +
 *      Garden + Lounge). NULL = whole-venue block. Hidden when the venue
 *      only has one space.
 *
 * No commission section — that's vendor-only (V-2b smoke-fix session 23).
 */

type Props = {
  spaces: VenueSpace[];
  onClose: () => void;
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_OPTIONS = [0, 15, 30, 45];

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AvailabilityBlockSheet({ spaces, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState<string>(todayIso());
  const [spaceId, setSpaceId] = useState<string | "">("");
  const [mode, setMode] = useState<"allDay" | "partial">("allDay");
  const [startHour, setStartHour] = useState(6);
  const [startMin, setStartMin] = useState(0);
  const [startPm, setStartPm] = useState(true);
  const [endHour, setEndHour] = useState(11);
  const [endMin, setEndMin] = useState(0);
  const [endPm, setEndPm] = useState(true);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function toHHMMSS(hour12: number, minute: number, isPm: boolean): string {
    let h = hour12 % 12;
    if (isPm) h += 12;
    return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  }

  function handleSubmit() {
    setError(null);
    const startTime =
      mode === "allDay" ? null : toHHMMSS(startHour, startMin, startPm);
    const endTime =
      mode === "allDay" ? null : toHHMMSS(endHour, endMin, endPm);
    startTransition(async () => {
      const res = await createAvailabilityBlock({
        blockedDate: date,
        venueSpaceId: spaceId === "" ? null : spaceId,
        startTime,
        endTime,
        reason: reason.trim() || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label="Add availability block">
        <div className={s.header}>
          <div>
            <div className={s.title}>New block</div>
            <div className={s.subtitle}>Mark a date or window unavailable</div>
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

        <div className={s.fieldRow}>
          <label className={s.fieldLbl} htmlFor="block-date">
            Date
          </label>
          <input
            id="block-date"
            type="date"
            className={s.dateInput}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {spaces.length > 1 && (
          <div className={s.fieldRow}>
            <label className={s.fieldLbl} htmlFor="block-space">
              Space
            </label>
            <select
              id="block-space"
              className={s.spaceSel}
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

        <div className={s.sectionLbl}>Window</div>
        <div className={s.toggleRow}>
          <button
            type="button"
            className={`${s.toggle} ${mode === "allDay" ? s.toggleOn : ""}`}
            onClick={() => setMode("allDay")}
          >
            All day
          </button>
          <button
            type="button"
            className={`${s.toggle} ${mode === "partial" ? s.toggleOn : ""}`}
            onClick={() => setMode("partial")}
          >
            Pick hours
          </button>
        </div>

        {mode === "partial" && (
          <>
            <div className={s.timeRow}>
              <div className={s.timeLbl}>From</div>
              <div className={s.timeField}>
                <select
                  className={s.timeSel}
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  aria-label="Start hour"
                >
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  className={s.timeSel}
                  value={startMin}
                  onChange={(e) => setStartMin(Number(e.target.value))}
                  aria-label="Start minute"
                >
                  {MINUTE_OPTIONS.map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                  ))}
                </select>
                <select
                  className={s.timeSel}
                  value={startPm ? "PM" : "AM"}
                  onChange={(e) => setStartPm(e.target.value === "PM")}
                  aria-label="Start AM/PM"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div className={s.timeRow}>
              <div className={s.timeLbl}>To</div>
              <div className={s.timeField}>
                <select
                  className={s.timeSel}
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  aria-label="End hour"
                >
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  className={s.timeSel}
                  value={endMin}
                  onChange={(e) => setEndMin(Number(e.target.value))}
                  aria-label="End minute"
                >
                  {MINUTE_OPTIONS.map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                  ))}
                </select>
                <select
                  className={s.timeSel}
                  value={endPm ? "PM" : "AM"}
                  onChange={(e) => setEndPm(e.target.value === "PM")}
                  aria-label="End AM/PM"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </>
        )}

        <textarea
          className={s.reason}
          placeholder="Reason (optional) — e.g., renovation, private event"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error && <div className={s.errMsg}>{error}</div>}

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
            {pending ? "Saving…" : "Block this date"}
          </button>
        </div>
      </div>
    </>
  );
}
