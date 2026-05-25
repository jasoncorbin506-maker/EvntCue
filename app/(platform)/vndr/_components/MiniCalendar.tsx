"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CalendarMonth, CalendarCell } from "@/lib/vndr/calendar-month";
import type { VndrAvailabilityBlock } from "@/lib/vndr/availability";
import s from "../vndr.module.css";
import { AvailabilityBlockSheet } from "./AvailabilityBlockSheet";
import type { ExistingBlock } from "./AvailabilityBlockSheet";

/**
 * V-2b Mini Calendar (replaces V-2a's hardcoded June 2026 grid). Reads
 * server-prepared CalendarMonth, renders the 7-column day grid with
 * leading blanks for the first day-of-week offset, and handles taps:
 *
 *   - Open + blocked cells → open AvailabilityBlockSheet to add/edit/remove
 *     blocks for that date.
 *   - Booked cells → route to /vndr/bookings (the canonical edit surface
 *     for confirmed bookings).
 *   - Inquiry cells → route to /vndr/inquiries (where vendor can quote/decline).
 *
 * V-2b smoke-fix (session 23, 2026-05-25): previously booked/inquiry cells
 * were `disabled={true}` and silently did nothing — felt like a broken
 * click target. Now all cells are tappable with meaningful destinations.
 *
 * Month nav is local state for V-2b (each nav re-renders client-side from
 * the parent-supplied initial month + N delta loads on demand from a
 * follow-up server-action call). For Session A we ship the current month
 * only; nav prefetch is a Session B polish if needed.
 */

type Props = {
  month: CalendarMonth;
  blocks: VndrAvailabilityBlock[];
  /**
   * Vendor's profile-level default commission rate (vendors.referral_rate_pct).
   * Shown in the AvailabilityBlockSheet's Commission section as the
   * "default" the override deviates from. Null when vendor hasn't set
   * a profile default yet.
   */
  defaultCommissionPct: number | null;
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

export function MiniCalendar({ month, blocks, defaultCommissionPct }: Props) {
  const router = useRouter();
  const [sheetDate, setSheetDate] = useState<string | null>(null);

  // Map of date → commissionPct for fast lookup when opening the sheet.
  const commissionByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of month.cells) {
      if (c.commissionPct !== null) m.set(c.date, c.commissionPct);
    }
    return m;
  }, [month.cells]);

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
    if (cell.state === "booked") {
      router.push("/vndr/bookings");
      return;
    }
    if (cell.state === "inquiry") {
      router.push("/vndr/inquiries");
      return;
    }
    // Open + blocked cells: open the sheet for add/edit/delete.
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
          // All cells are tappable now — booked + inquiry route to their
          // tabs; open + blocked open the AvailabilityBlockSheet (V-2b
          // smoke-fix session 23). Previously booked/inquiry were disabled
          // which read as a broken click target.
          const hasOverride = cell.commissionPct !== null;
          return (
            <button
              key={cell.date}
              type="button"
              className={classes.join(" ")}
              onClick={() => handleCellTap(cell)}
              aria-label={cellAriaLabel(cell)}
            >
              {cell.day}
              {hasOverride && (
                <span
                  className={s.calCommMark}
                  aria-label={`Commission override ${cell.commissionPct}%`}
                >
                  $
                </span>
              )}
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
          existingCommissionPct={commissionByDate.get(sheetDate) ?? null}
          defaultCommissionPct={defaultCommissionPct}
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
