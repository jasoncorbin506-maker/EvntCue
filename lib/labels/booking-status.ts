/**
 * Booking-status display labels — Lock 15 translation layer.
 *
 * Maps the 6-state `booking_status` enum from migration 001 to public
 * UI strings + visual-tone classifiers. DB speaks engineer-talk
 * (pending_venue_lock); UI speaks user-talk (Tentative).
 *
 * Tone groupings:
 *   - confirmed  → "confirmed" visual (gold accent in the Venu portal)
 *   - tentative  → "tentative" visual (covers pending + pending_venue_lock)
 *   - completed  → "completed" visual (past events)
 *   - cancelled/disputed → "cancelled" visual (no display in active lists yet)
 */

export type BookingStatus =
  | "pending"
  | "pending_venue_lock"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "disputed";

export type BookingStatusTone = "confirmed" | "tentative" | "completed" | "cancelled";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Tentative",
  pending_venue_lock: "Awaiting lock",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Done",
  disputed: "Disputed",
};

const STATUS_TONES: Record<BookingStatus, BookingStatusTone> = {
  pending: "tentative",
  pending_venue_lock: "tentative",
  confirmed: "confirmed",
  cancelled: "cancelled",
  completed: "completed",
  disputed: "cancelled",
};

export function bookingStatusLabel(status: string): string {
  return STATUS_LABELS[status as BookingStatus] ?? status;
}

export function bookingStatusTone(status: string): BookingStatusTone {
  return STATUS_TONES[status as BookingStatus] ?? "tentative";
}
