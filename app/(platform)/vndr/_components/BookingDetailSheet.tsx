"use client";

import type { VndrBooking, VndrBookingStatus } from "@/lib/vndr/bookings";
import s from "./InquiryDetailSheet.module.css";

/**
 * Bottom-sheet detail view for a single booking. Read-only for V-2b —
 * cancellation + completion flows are V-2c (require disputes / refund
 * handling per Lock 24). Shows event info + amount breakdown + status
 * timeline metadata.
 *
 * Reuses InquiryDetailSheet.module.css for the drawer shell; bookings-
 * specific layout fits the same panels (header / sectionLbl / footer).
 */

type Props = {
  booking: VndrBooking;
  onClose: () => void;
};

const STATUS_LABEL: Record<VndrBookingStatus, string> = {
  pending: "Pending",
  pending_venue_lock: "Pending venue lock",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  disputed: "Disputed",
};

function formatEventDate(date: string): string {
  if (!date) return "Date TBD";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatStartTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function BookingDetailSheet({ booking, onClose }: Props) {
  const time = formatStartTime(booking.startTime);

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label="Booking detail">
        <div className={s.header}>
          <div>
            <div className={s.title}>{booking.eventName}</div>
            <div className={s.subtitle}>
              {formatEventDate(booking.eventDate)}
              {time && ` · ${time}`}
              {" · "}
              {STATUS_LABEL[booking.status]}
            </div>
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

        <div className={s.sectionLbl}>Guests</div>
        <div className={s.message}>
          {booking.guestCount > 0
            ? `${booking.guestCount} expected`
            : "Guest count TBD"}
        </div>

        <div className={s.sectionLbl}>Total</div>
        <div className={s.priceReadonly}>{formatMoney(booking.totalCents)}</div>

        <div className={s.sectionLbl}>Your payout</div>
        <div className={s.priceReadonly}>
          {formatMoney(booking.vendorPayoutCents)}
        </div>
        <div className={s.hint}>
          After platform fees + referral splits. Cleared on the schedule per
          your booking policy.
        </div>

        <div className={s.footer}>
          <button type="button" className={s.btn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
