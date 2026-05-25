"use client";

import { useState, useTransition } from "react";
import { upsertAvailabilityBlock } from "../_actions/upsert-availability-block";
import { deleteAvailabilityBlock } from "../_actions/delete-availability-block";
import s from "./AvailabilityBlockSheet.module.css";

/**
 * Bottom sheet for managing availability blocks on a single date. Opened
 * from MiniCalendar on cell tap. Surfaces:
 *
 *   - Existing blocks for that date (one row each) — partial-day shows
 *     "06:00 PM – 11:00 PM", whole-day shows "All day"; each row has a
 *     delete affordance
 *   - "Block all day" + "Pick hours…" toggle for adding a new block
 *   - When "Pick hours…" is selected: two HH + MM + AM/PM control rows
 *     for start and end
 *   - Optional reason textarea
 *   - Cancel + Add to calendar footer
 *
 * Times stored as HH:MM:SS (24h). UI presents 12h AM/PM. The chip-based
 * TimePicker from session 18p is rich (presets, "all day"); for the
 * partial-day block use case we want a tighter pair of pickers so the
 * sheet stays compact on a 390px mobile frame.
 */

export type ExistingBlock = {
  id: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

type Props = {
  date: string;
  existingBlocks: ExistingBlock[];
  onClose: () => void;
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_OPTIONS = [0, 15, 30, 45];

export function AvailabilityBlockSheet({ date, existingBlocks, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [existing, setExisting] = useState<ExistingBlock[]>(existingBlocks);
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

  function formatTime(timeStr: string | null): string {
    if (!timeStr) return "All day";
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }

  function handleSubmit() {
    setError(null);
    const startTime =
      mode === "allDay" ? null : toHHMMSS(startHour, startMin, startPm);
    const endTime =
      mode === "allDay" ? null : toHHMMSS(endHour, endMin, endPm);
    startTransition(async () => {
      const res = await upsertAvailabilityBlock({
        blockedDate: date,
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

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteAvailabilityBlock(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setExisting((prev) => prev.filter((b) => b.id !== id));
    });
  }

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" },
  );

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label="Manage availability">
        <div className={s.header}>
          <div>
            <div className={s.title}>{formattedDate}</div>
            <div className={s.subtitle}>Manage availability</div>
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

        {/* Existing blocks list */}
        {existing.length > 0 && (
          <>
            <div className={s.sectionLbl}>Already blocked</div>
            <div className={s.existingList}>
              {existing.map((b) => (
                <div key={b.id} className={s.existingRow}>
                  <div>
                    <b>
                      {b.startTime
                        ? `${formatTime(b.startTime)} – ${formatTime(b.endTime)}`
                        : "All day"}
                    </b>
                    {b.reason ? ` · ${b.reason}` : ""}
                  </div>
                  <button
                    type="button"
                    className={s.deleteBtn}
                    onClick={() => handleDelete(b.id)}
                    disabled={pending}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={s.sectionLbl}>Add a block</div>
        <div className={s.toggleRow}>
          <button
            type="button"
            className={`${s.toggle} ${mode === "allDay" ? s.toggleOn : ""}`}
            onClick={() => setMode("allDay")}
          >
            Block all day
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
          placeholder="Reason (optional) — e.g., personal day, travel"
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
