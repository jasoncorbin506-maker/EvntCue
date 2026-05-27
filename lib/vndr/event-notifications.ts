import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  DateChangePayload,
  EventNotificationResponse,
} from "@/lib/events/event-notifications-shared";

/**
 * Vendor-side reads against `event_notifications`. Filtered by
 * `vendor_tenant_id` (the receiver). Used by the Inquiries tab to render
 * the date-change card variant + day-7 reminder state, and by the
 * date-change detail page.
 *
 * RLS scopes the result to the current vendor's tenant — no additional
 * authorization required at the call site.
 */

export type VndrDateChangeNotification = {
  id: string;
  eventId: string;
  bookingId: string | null;
  payload: DateChangePayload;
  vendorResponse: EventNotificationResponse;
  createdAt: string;
  reminderSentAt: string | null;
  resolvedAt: string | null;

  // Joined event context (Lock 24 UX: card subtitle "[Orgnz name] moved the
  // [event type] to [new date]"). Orgnz display name resolves from the
  // event's tenant — back-of-house naming, so EN-only is fine per
  // lib/labels/README.md phasing.
  eventName: string;
  eventType: string;
  eventStartDate: string;
};

const SELECT_WITH_EVENT = `
  id,
  event_id,
  booking_id,
  payload,
  vendor_response,
  created_at,
  reminder_sent_at,
  resolved_at,
  events!inner ( name, event_type, start_date )
`;

function shape(row: Record<string, unknown>): VndrDateChangeNotification {
  const eventJoin = (row.events ?? {}) as Record<string, unknown>;
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    bookingId: (row.booking_id as string | null) ?? null,
    payload: (row.payload ?? {}) as DateChangePayload,
    vendorResponse: row.vendor_response as EventNotificationResponse,
    createdAt: row.created_at as string,
    reminderSentAt: (row.reminder_sent_at as string | null) ?? null,
    resolvedAt: (row.resolved_at as string | null) ?? null,
    eventName: (eventJoin.name as string | null) ?? "Untitled event",
    eventType: (eventJoin.event_type as string | null) ?? "other",
    eventStartDate: (eventJoin.start_date as string | null) ?? "",
  };
}

/**
 * Pending date-change notifications for the current vendor. Used by the
 * Inquiries tab to surface the card variant.
 */
export async function getPendingDateChangeNotifications(
  vendorTenantId: string,
): Promise<VndrDateChangeNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_notifications")
    .select(SELECT_WITH_EVENT)
    .eq("vendor_tenant_id", vendorTenantId)
    .eq("type", "date_change")
    .eq("vendor_response", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

/**
 * Single notification by id — for the detail page. RLS still applies, so
 * the wrong vendor querying by id gets null.
 */
export async function getDateChangeNotificationById(
  notificationId: string,
): Promise<VndrDateChangeNotification | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_notifications")
    .select(SELECT_WITH_EVENT)
    .eq("id", notificationId)
    .eq("type", "date_change")
    .maybeSingle();
  if (!data) return null;
  return shape(data as Record<string, unknown>);
}
