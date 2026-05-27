/**
 * Client-safe types for event_notifications (Lock 24, migration 068).
 *
 * Schema source-of-record: `00_Live/deploy/068_event_notifications.sql`.
 * Lock entry: `product/decisions-log/2026-05-23-vendor-notification-schema-and-flow.md`.
 *
 * Mirrors the split-shared pattern (session 23 + V-2c session 1) so Client
 * Components can import these types without dragging `import "server-only"`
 * from the Chunk B write-path module (lib/events/notifications.ts) into the
 * browser bundle.
 *
 * Chunk A scope: this file ships the types only. The write path, accept/
 * decline server actions, cron jobs, and email templates land in Chunks B–E.
 */

// =============================================================================
// Enums (mirror the SQL CHECK constraints exactly)
// =============================================================================

/**
 * Notification kind. Lock 24 ships date_change as the V1 driver; time_change
 * and cancellation are reserved in the schema for future expansion without a
 * follow-up migration.
 */
export type EventNotificationType =
  | "date_change"
  | "time_change"
  | "cancellation";

/**
 * Vendor response lifecycle. Pending until the vendor acts or the 14-day
 * expiry cron flips to expired. `superseded_by` flow also routes here via
 * `expired` (vendor sees only the latest pending notification per event).
 *
 * Decline does NOT cascade to bookings.status — that's an explicit orgnz
 * choice through the feed-card "review options" affordance (Chunk D). Per
 * Lock 22 forgiveness pattern (lock entry Q2 reasoning).
 */
export type EventNotificationResponse =
  | "pending"
  | "accepted"
  | "declined"
  | "expired";

// =============================================================================
// Per-type payload shapes
// =============================================================================

/**
 * Payload for `type = 'date_change'`. Captures both date and time so a single
 * notification can carry "moved from Saturday to Sunday" + "moved start from
 * 4pm to 6pm" in one row when the orgnz commits both at once.
 *
 * Times are nullable so an all-day event remains representable. Reason is
 * free-text and the UI hides the section entirely when it's null (UX critique
 * pass #1.5 disposition).
 */
export type DateChangePayload = {
  oldStartDate: string;        // ISO date (YYYY-MM-DD)
  oldStartTime: string | null; // HH:MM:SS or null for all-day
  oldEndDate: string | null;   // null = single-day event before
  oldEndTime: string | null;
  newStartDate: string;
  newStartTime: string | null;
  newEndDate: string | null;
  newEndTime: string | null;
  reason: string | null;       // free-text from EventDateEditor; null = not provided
};

/**
 * Payload for `type = 'time_change'`. Time-only variant for events where the
 * date stays put but start/end times shift (e.g., ceremony moved earlier in
 * the day to accommodate a venue's hard cutoff). Schema-level distinction
 * lets the UI render a tighter card ("time changed, date is the same") vs.
 * a full date-change card.
 */
export type TimeChangePayload = {
  startDate: string;           // unchanged; included so the card can render context
  oldStartTime: string | null;
  newStartTime: string | null;
  oldEndTime: string | null;
  newEndTime: string | null;
  reason: string | null;
};

/**
 * Payload for `type = 'cancellation'`. Reserved for future use — Lock 24's
 * V1 scope is date_change only. When implemented, this will route through
 * the existing booking_cancellation_requests table (migration 063) rather
 * than duplicating that flow; the notification here would surface "your
 * orgnz wants to cancel — review the request" cross-referencing the
 * cancellation request row.
 */
export type CancellationPayload = {
  reason_category: string;
  reason_text: string | null;
  cancellation_request_id: string | null; // FK to booking_cancellation_requests.id
};

/**
 * Discriminated union over all notification payload shapes. Use this when
 * narrowing by `notification.type` at the call site.
 */
export type EventNotificationPayload =
  | { type: "date_change"; data: DateChangePayload }
  | { type: "time_change"; data: TimeChangePayload }
  | { type: "cancellation"; data: CancellationPayload };

// =============================================================================
// Row shape (mirrors the DB table; ISO strings on the wire)
// =============================================================================

export type EventNotification = {
  id: string;
  eventId: string;
  vendorTenantId: string;
  bookingId: string | null;
  type: EventNotificationType;
  /**
   * Stored as JSONB; shape depends on `type`. Narrow via
   * `EventNotificationPayload` discriminated union when reading.
   */
  payload: unknown;
  vendorResponse: EventNotificationResponse;
  /** Set when a later notification supersedes this one. */
  supersededBy: string | null;
  createdAt: string;       // ISO timestamp
  reminderSentAt: string | null;
  resolvedAt: string | null;
};

// =============================================================================
// Lifecycle constants (Lock 24 Q3 — 14d flat + 7d reminder)
// =============================================================================

/**
 * Re-acceptance window (days). Vendor has this many days to respond before
 * the cron flips vendor_response to 'expired'. Flat for V1 per Lock 24 Q3;
 * configurability per-tenant is a deferred V2 concern.
 */
export const NOTIFICATION_EXPIRY_DAYS = 14;

/**
 * Day-7 reminder threshold. When `now - created_at >= REMINDER_DAYS` and
 * `reminder_sent_at IS NULL`, the cron sends a follow-up email and stamps
 * `reminder_sent_at`. UI surfaces the "reminder sent — please respond"
 * badge once `reminder_sent_at` is set.
 */
export const NOTIFICATION_REMINDER_DAYS = 7;

/**
 * Auto-collapse window for resolved cards (UX critique pass #5.1). Cards
 * that have been resolved for this long collapse to a thin summary line on
 * the orgnz feed strip.
 */
export const NOTIFICATION_AUTO_COLLAPSE_DAYS = 7;

/**
 * Auto-archive window for expired cards post-event (UX critique pass #5.4).
 * Cards expire when the event date has passed by this many days.
 */
export const NOTIFICATION_AUTO_ARCHIVE_DAYS_POST_EVENT = 30;

// =============================================================================
// Type guards
// =============================================================================

export function isEventNotificationType(
  value: unknown,
): value is EventNotificationType {
  return (
    value === "date_change" || value === "time_change" || value === "cancellation"
  );
}

export function isEventNotificationResponse(
  value: unknown,
): value is EventNotificationResponse {
  return (
    value === "pending" ||
    value === "accepted" ||
    value === "declined" ||
    value === "expired"
  );
}
