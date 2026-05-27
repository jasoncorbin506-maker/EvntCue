"use client";

import { useState } from "react";
import type { VndrBooking, VndrBookingStatus } from "@/lib/vndr/bookings";
import { CancellationRequestSheet } from "./CancellationRequestSheet";
import s from "./InquiryDetailSheet.module.css";

/**
 * Bottom-sheet detail view for a single booking. V-2c Session 2 adds the
 * vendor-side cancellation request path: when status is 'confirmed', a
 * "Request cancellation" button opens CancellationRequestSheet. Booking
 * status flips to 'cancellation_requested' on submit (mig 063 enum +
 * request-booking-cancellation action). Refund flow stays Phase 4 — V-2c
 * only captures the ask + organizer's approve/deny.
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
  pending_venue_lock: "Pending Venu lock",
  confirmed: "Confirmed",
  cancellation_requested: "Cancellation requested",
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
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const canRequestCancellation = booking.status === "confirmed";
  const cancellationPending = booking.status === "cancellation_requested";

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

        {cancellationPending && (
          <div className={s.hint} style={{ marginTop: 12, color: "var(--coral)" }}>
            Cancellation request pending. The organizer can approve or deny.
          </div>
        )}

        <div className={s.footer}>
          {canRequestCancellation && (
            <button
              type="button"
              className={`${s.btn} ${s.btnGhost}`}
              onClick={() => setCancelSheetOpen(true)}
            >
              Request cancellation
            </button>
          )}
          <button type="button" className={s.btn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {cancelSheetOpen && (
        <CancellationRequestSheet
          bookingId={booking.id}
          bookingHeadline={`${booking.eventName} · ${formatEventDate(booking.eventDate)}`}
          onClose={() => setCancelSheetOpen(false)}
        />
      )}
    </>
  );
}
