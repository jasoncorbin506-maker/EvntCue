"use client";

import { useMemo, useState } from "react";
import type { VndrBooking, VndrBookingStatus } from "@/lib/vndr/bookings";
import { BookingDetailSheet } from "./BookingDetailSheet";
import s from "../vndr.module.css";

/**
 * Bookings tab — list + filter chips + tap-to-detail. Read-only view for
 * V-2b; cancellation/completion flows are V-2c (require disputes + refund
 * handling). Filter chips: Upcoming / Past / Cancelled per the original
 * V-2b brief.
 *
 * Upcoming includes pending, pending_venue_lock, and confirmed bookings
 * where event_date >= today. Past includes confirmed/completed bookings
 * where event_date < today (a confirmed booking whose date has passed but
 * hasn't been marked completed sits in Past — the vendor still gets the
 * payout eventually; this is just visual classification). Cancelled
 * groups cancelled + disputed.
 */

type Filter = "upcoming" | "past" | "cancelled";

const FILTER_LABELS: Record<Filter, string> = {
  upcoming: "Upcoming",
  past: "Past",
  cancelled: "Cancelled",
};

const CANCELLED_STATUSES: VndrBookingStatus[] = ["cancelled", "disputed"];

const STATUS_PILL: Record<VndrBookingStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: s.pillReviewing ?? "" },
  pending_venue_lock: { label: "Venue pending", cls: s.pillReviewing ?? "" },
  confirmed: { label: "Confirmed", cls: s.pillBooked ?? "" },
  completed: { label: "Completed", cls: s.pillBooked ?? "" },
  cancelled: { label: "Cancelled", cls: s.pillCancelled ?? "" },
  disputed: { label: "Disputed", cls: s.pillCancelled ?? "" },
};

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function classify(b: VndrBooking, today: string): Filter {
  if (CANCELLED_STATUSES.includes(b.status)) return "cancelled";
  if (!b.eventDate) return "upcoming"; // date TBD treated as upcoming
  return b.eventDate >= today ? "upcoming" : "past";
}

function formatEventDate(date: string): string {
  if (!date) return "Date TBD";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

type Props = {
  bookings: VndrBooking[];
};

export function BookingsList({ bookings }: Props) {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [openId, setOpenId] = useState<string | null>(null);
  const today = todayIsoDate();

  const buckets = useMemo(() => {
    const b: Record<Filter, VndrBooking[]> = {
      upcoming: [],
      past: [],
      cancelled: [],
    };
    for (const bk of bookings) {
      b[classify(bk, today)].push(bk);
    }
    // Upcoming oldest→newest (next event first); Past + Cancelled newest→oldest.
    b.upcoming.sort((a, c) => (a.eventDate ?? "").localeCompare(c.eventDate ?? ""));
    b.past.sort((a, c) => (c.eventDate ?? "").localeCompare(a.eventDate ?? ""));
    b.cancelled.sort((a, c) => (c.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return b;
  }, [bookings, today]);

  const visible = buckets[filter];
  const openBooking = openId ? bookings.find((b) => b.id === openId) ?? null : null;

  return (
    <div className={s.tabBody}>
      <div className={s.filterRow} role="tablist">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={`${s.filterChip} ${filter === f ? s.filterChipOn : ""}`.trim()}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]}
            {buckets[f].length > 0 && (
              <span className={s.filterCount}>{buckets[f].length}</span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className={s.emptyState}>
          {filter === "upcoming"
            ? "No upcoming bookings. Quotes that get accepted will show up here."
            : filter === "past"
              ? "No past bookings yet."
              : "No cancelled bookings."}
        </div>
      ) : (
        <div className={s.bkList}>
          {visible.map((bk) => {
            const pill = STATUS_PILL[bk.status];
            return (
              <button
                key={bk.id}
                type="button"
                className={s.bkRow}
                onClick={() => setOpenId(bk.id)}
              >
                <div className={s.bkRowTop}>
                  <span className={s.bkEventName}>{bk.eventName}</span>
                  <span className={`${s.statusPill} ${pill.cls}`.trim()}>
                    {pill.label}
                  </span>
                </div>
                <div className={s.bkRowMid}>
                  {formatEventDate(bk.eventDate)}
                  {bk.guestCount > 0 && ` · ${bk.guestCount} guests`}
                </div>
                <div className={s.bkRowFoot}>
                  <span>Your payout</span>
                  <span className={s.bkAmount}>
                    {formatMoney(bk.vendorPayoutCents)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {openBooking && (
        <BookingDetailSheet
          booking={openBooking}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
