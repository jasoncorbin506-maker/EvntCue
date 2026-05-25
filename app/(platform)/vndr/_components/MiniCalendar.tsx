"use client";

import { useMemo, useState } from "react";
import type { CalendarMonth, CalendarCell } from "@/lib/vndr/calendar-month";
import type { VndrAvailabilityBlock } from "@/lib/vndr/availability";
import s from "../vndr.module.css";
import { AvailabilityBlockSheet } from "./AvailabilityBlockSheet";
import type { ExistingBlock } from "./AvailabilityBlockSheet";

/**
 * V-2b Mini Calendar (replaces V-2a's hardcoded June 2026 grid). Reads
 * server-prepared CalendarMonth, renders the 7-column day grid with
 * leading blanks for the first day-of-week offset, and opens
 * AvailabilityBlockSheet on tap of an open/blocked cell so the vendor can
 * add or edit availability blocks.
 *
 * Booked/inquiry cells render the existing visual treatment but don't open
 * the sheet — those are read-only on the calendar (the Inquiries/Bookings
 * tabs are the canonical edit surfaces for those).
 *
 * Month nav is local state for V-2b (each nav re-renders client-side from
 * the parent-supplied initial month + N delta loads on demand from a
 * follow-up server-action call). For Session A we ship the current month
 * only; nav prefetch is a Session B polish if needed.
 */

type Props = {
  month: CalendarMonth;
  blocks: VndrAvailabilityBlock[];
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function MiniCalendar({ month, blocks }: Props) {
  const [sheetDate, setSheetDate] = useState<string | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const monthLabel = `${MONTH_LABELS[month.month - 1]} ${month.year}`;

  const blocksByDate = useMemo(() => {
    const map = new Map<string, ExistingBlock[]>();
    for (const b of blocks) {
      const arr = map.get(b.blockedDate) ?? [];
      arr.push({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
      });
      map.set(b.blockedDate, arr);
    }
    return map;
  }, [blocks]);

  function handleCellTap(cell: CalendarCell) {
    // Booked and inquiry cells route to their respective tabs rather than
    // open the block sheet. Open + blocked cells open the sheet for
    // add/edit/delete.
    if (cell.state === "booked" || cell.state === "inquiry") return;
    setSheetDate(cell.date);
  }

  return (
    <div className={s.calCard}>
      <div className={s.calHead}>
        <div className={s.calMon}>{monthLabel}</div>
        <div className={s.calNav}>
          {/* Month nav is a Session B polish — current month only in V-2b. */}
          <button
            type="button"
            className={s.calNb}
            aria-label="Previous month"
            disabled
          >
            ‹
          </button>
          <button
            type="button"
            className={s.calNb}
            aria-label="Next month"
            disabled
          >
            ›
          </button>
        </div>
      </div>
      <div className={s.calGrid}>
        {DAY_LABELS.map((d, i) => (
          <div key={`dow-${i}`} className={s.calDow}>
            {d}
          </div>
        ))}
        {Array.from({ length: month.firstDayOfWeek }).map((_, i) => (
          <div key={`blank-${i}`} className={s.calD} aria-hidden="true" />
        ))}
        {month.cells.map((cell) => {
          const isToday = cell.date === todayIso;
          const classes = [s.calD, s.calCellBtn];
          if (isToday) classes.push(s.calToday);
          else if (cell.state === "booked") classes.push(s.calBooked);
          else if (cell.state === "inquiry") classes.push(s.calInquiry);
          else if (cell.state === "blocked") {
            classes.push(s.calBlocked);
            if (cell.partial) classes.push(s.calBlockedPartial);
          }
          const isTappable =
            cell.state === "open" || cell.state === "blocked";
          return (
            <button
              key={cell.date}
              type="button"
              className={classes.join(" ")}
              onClick={() => handleCellTap(cell)}
              aria-label={cellAriaLabel(cell)}
              disabled={!isTappable}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className={s.calLegend}>
        <div className={s.calLegItem}>
          <span className={s.calLegDot} style={{ background: "var(--teal)" }} />
          Booked
        </div>
        <div className={s.calLegItem}>
          <span className={s.calLegDot} style={{ background: "var(--amber)" }} />
          Inquiry
        </div>
        <div className={s.calLegItem}>
          <span className={s.calLegDot} style={{ background: "var(--txt3)" }} />
          Blocked
        </div>
      </div>
      {sheetDate && (
        <AvailabilityBlockSheet
          date={sheetDate}
          existingBlocks={blocksByDate.get(sheetDate) ?? []}
          onClose={() => setSheetDate(null)}
        />
      )}
    </div>
  );
}

function cellAriaLabel(cell: CalendarCell): string {
  const base = `${cell.date}, ${cell.state}`;
  if (cell.state === "blocked" && cell.partial) return `${base}, partial day`;
  return base;
}
