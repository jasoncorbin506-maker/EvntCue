import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  DateChangePayload,
  EventNotificationResponse,
} from "@/lib/events/event-notifications-shared";

/**
 * Orgnz-side reads against `event_notifications` for the Lock 24 feed
 * strip below the Hero on the event detail page. RLS scopes to events
 * the orgnz owns (via the user_owns_event helper).
 *
 * Returns rows with vendor display info + booking context joined so the
 * feed cards can render "[Vendor name] accepted the date change."
 * without N+1 lookups.
 */

export type OrgnzEventNotification = {
  id: string;
  vendorTenantId: string;
  bookingId: string | null;
  payload: DateChangePayload;
  vendorResponse: EventNotificationResponse;
  supersededBy: string | null;
  createdAt: string;
  resolvedAt: string | null;

  // Joined for card display
  vendorDisplayName: string;
  bookingStatus: string | null;
};

const SELECT_WITH_JOINS = `
  id,
  vendor_tenant_id,
  booking_id,
  payload,
  vendor_response,
  superseded_by,
  created_at,
  resolved_at,
  tenants!event_notifications_vendor_tenant_id_fkey ( name ),
  bookings ( status )
`;

function shape(row: Record<string, unknown>): OrgnzEventNotification {
  const tenantJoin = (row.tenants ?? {}) as Record<string, unknown>;
  const bookingJoin = (row.bookings ?? {}) as Record<string, unknown>;
  return {
    id: row.id as string,
    vendorTenantId: row.vendor_tenant_id as string,
    bookingId: (row.booking_id as string | null) ?? null,
    payload: (row.payload ?? {}) as DateChangePayload,
    vendorResponse: row.vendor_response as EventNotificationResponse,
    supersededBy: (row.superseded_by as string | null) ?? null,
    createdAt: row.created_at as string,
    resolvedAt: (row.resolved_at as string | null) ?? null,
    vendorDisplayName: (tenantJoin.name as string | null) ?? "Vndr",
    bookingStatus: (bookingJoin.status as string | null) ?? null,
  };
}

/**
 * All date-change notifications for an event whose `vendor_response` is
 * resolved (accepted / declined / expired). Excludes `pending` rows
 * (those live on the vendor side and don't surface to orgnz until the
 * vendor responds) and excludes `superseded_by IS NOT NULL` rows
 * (system-resolved supersessions are noise on the feed).
 *
 * Ordered for the UX critique #5.2 V1 disposition:
 *   severity first (declined + expired before accepted),
 *   chronological within group.
 */
export async function getOrgnzEventNotifications(
  eventId: string,
): Promise<OrgnzEventNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_notifications")
    .select(SELECT_WITH_JOINS)
    .eq("event_id", eventId)
    .eq("type", "date_change")
    .in("vendor_response", ["accepted", "declined", "expired"])
    .is("superseded_by", null)
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((row) => shape(row as Record<string, unknown>));

  // Severity-first sort per UX critique #5.2 V1:
  //   declined + expired (severity buckets) before accepted.
  //   Within each bucket: chronological DESC (newest first).
  const severityRank: Record<EventNotificationResponse, number> = {
    declined: 0,
    expired: 1,
    accepted: 2,
    pending: 3, // not in the result set; guard anyway
  };
  rows.sort((a, b) => {
    const rankDiff = severityRank[a.vendorResponse] - severityRank[b.vendorResponse];
    if (rankDiff !== 0) return rankDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return rows;
}
