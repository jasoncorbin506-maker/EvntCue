/**
 * Client-safe types + constants for booking_cancellation_requests
 * (V-2c Session 2 Stream B, mig 063).
 *
 * Mirrors the split pattern from lib/messaging/inquiry-thread-shared.ts —
 * Client Components import types/constants from here without dragging
 * `import "server-only"` from lib/bookings/cancellation-requests.ts into
 * the browser bundle.
 */

export const CANCELLATION_CATEGORIES = [
  "illness",
  "scheduling_conflict",
  "outside_cancellation_window",
  "force_majeure",
  "other",
] as const;

export type CancellationCategory = (typeof CANCELLATION_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CancellationCategory, string> = {
  illness: "Illness / emergency",
  scheduling_conflict: "Scheduling conflict",
  outside_cancellation_window: "Outside cancellation window",
  force_majeure: "Force majeure (weather / venue issue)",
  other: "Other",
};

export type BookingCancellationRequestStatus = "pending" | "approved" | "denied";
export type RequestedByRole = "vndr" | "orgnz";

export type BookingCancellationRequest = {
  id: string;
  bookingId: string;
  requestedByTenantId: string;
  requestedByRole: RequestedByRole;
  reasonCategory: CancellationCategory | string;
  reasonText: string | null;
  status: BookingCancellationRequestStatus;
  respondedAt: string | null;
  respondedByUserId: string | null;
  createdAt: string;
};

export type PendingCancellationForOrganizer = BookingCancellationRequest & {
  eventId: string;
  eventName: string;
  vendorDisplayName: string | null;
};
