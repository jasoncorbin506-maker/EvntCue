import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  BookingCancellationRequest,
  BookingCancellationRequestStatus,
  PendingCancellationForOrganizer,
  RequestedByRole,
} from "./cancellation-requests-shared";

/**
 * Server-side reads for booking_cancellation_requests (mig 063, V-2c
 * Session 2 Stream B). The request/approval surface is no-money-touch
 * V-2c work; refund flow joins Phase 4.
 *
 * Types + category constants live in cancellation-requests-shared.ts
 * so Client Components can import them without dragging `server-only`
 * into the browser bundle (same split-shared pattern as
 * lib/messaging/inquiry-thread-shared.ts).
 */

export type {
  BookingCancellationRequest,
  BookingCancellationRequestStatus,
  CancellationCategory,
  PendingCancellationForOrganizer,
  RequestedByRole,
} from "./cancellation-requests-shared";

export {
  CANCELLATION_CATEGORIES,
  CATEGORY_LABELS,
} from "./cancellation-requests-shared";

const COLS =
  "id, booking_id, requested_by_tenant_id, requested_by_role, reason_category, reason_text, status, responded_at, responded_by_user_id, created_at";

function shape(row: Record<string, unknown>): BookingCancellationRequest {
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    requestedByTenantId: row.requested_by_tenant_id as string,
    requestedByRole: row.requested_by_role as RequestedByRole,
    reasonCategory: row.reason_category as string,
    reasonText: (row.reason_text as string | null) ?? null,
    status: row.status as BookingCancellationRequestStatus,
    respondedAt: (row.responded_at as string | null) ?? null,
    respondedByUserId: (row.responded_by_user_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

/**
 * The active (pending) cancellation request for a given booking, if any.
 * Returns null when none exists. RLS scopes the read.
 */
export async function getActiveCancellationRequestForBooking(
  bookingId: string,
): Promise<BookingCancellationRequest | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_cancellation_requests")
    .select(COLS)
    .eq("booking_id", bookingId)
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const row = (data ?? [])[0] as Record<string, unknown> | undefined;
  return row ? shape(row) : null;
}

/**
 * Pending vendor-initiated cancellation requests for the organizer's
 * dashboard surface. Joined with event name + vendor display name so
 * the IncomingCancellationRequestSheet can render copy without per-row
 * fetches.
 */
export async function getPendingCancellationRequestsForOrganizer(
  orgnzTenantId: string,
): Promise<PendingCancellationForOrganizer[]> {
  const supabase = await createClient();

  // Step 1: organizer's events
  const { data: events } = await supabase
    .from("events")
    .select("id, name")
    .eq("orgnz_tenant_id", orgnzTenantId);
  const eventRows = (events ?? []) as Record<string, unknown>[];
  if (eventRows.length === 0) return [];
  const eventNameById = new Map<string, string>(
    eventRows.map((e) => [e.id as string, (e.name as string) ?? "Event"]),
  );

  // Step 2: bookings on those events
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, event_id, vndr_tenant_id")
    .in("event_id", Array.from(eventNameById.keys()));
  const bookingRows = (bookings ?? []) as Record<string, unknown>[];
  if (bookingRows.length === 0) return [];
  const bookingMeta = new Map<
    string,
    { eventId: string; vndrTenantId: string }
  >();
  for (const b of bookingRows) {
    bookingMeta.set(b.id as string, {
      eventId: b.event_id as string,
      vndrTenantId: b.vndr_tenant_id as string,
    });
  }

  // Step 3: pending vendor-initiated requests against those bookings
  const { data: requests } = await supabase
    .from("booking_cancellation_requests")
    .select(COLS)
    .in("booking_id", Array.from(bookingMeta.keys()))
    .eq("requested_by_role", "vndr")
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const requestRows = (requests ?? []) as Record<string, unknown>[];
  if (requestRows.length === 0) return [];

  // Step 4: vendor display names
  const vndrTenantIds = Array.from(
    new Set(
      requestRows
        .map((r) => bookingMeta.get(r.booking_id as string)?.vndrTenantId)
        .filter((v): v is string => Boolean(v)),
    ),
  );
  const { data: vendorRows } = await supabase
    .from("vendors")
    .select("tenant_id, display_name")
    .in("tenant_id", vndrTenantIds);
  const nameByTenant = new Map<string, string>();
  for (const v of vendorRows ?? []) {
    nameByTenant.set(
      (v as Record<string, unknown>).tenant_id as string,
      ((v as Record<string, unknown>).display_name as string | null) ?? "",
    );
  }

  return requestRows.map((row) => {
    const base = shape(row);
    const meta = bookingMeta.get(base.bookingId);
    return {
      ...base,
      eventId: meta?.eventId ?? "",
      eventName: meta ? eventNameById.get(meta.eventId) ?? "Event" : "Event",
      vendorDisplayName: meta ? nameByTenant.get(meta.vndrTenantId) ?? null : null,
    };
  });
}
