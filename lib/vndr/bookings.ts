import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Vendor-side reads against `bookings` (migration 001). Filters by
 * `vndr_tenant_id` (the receiving vendor's tenant) so each vendor sees only
 * their own confirmed work. Embeds the parent event for name/date display.
 *
 * Same disambiguated FK embed as `lib/venu/bookings.ts` —
 * `bookings.event_id → events.id` is the forward FK we want; the reverse
 * `events.venue_booking_id → bookings.id` requires the auto-named constraint
 * to anchor the embed.
 */

export type VndrBookingStatus =
  | "pending"
  | "pending_venue_lock"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "disputed";

export type VndrBooking = {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  startTime: string | null;
  guestCount: number;
  status: VndrBookingStatus;
  totalCents: number;
  vendorPayoutCents: number;
  createdAt: string;
};

const COLS =
  "id, event_id, status, total_cents, vendor_payout_cents, created_at, events!bookings_event_id_fkey!inner(name, start_date, start_time, guest_count)";

function shape(row: Record<string, unknown>): VndrBooking {
  const eventsField = row.events as Record<string, unknown> | Record<string, unknown>[] | null;
  const ev = (Array.isArray(eventsField) ? eventsField[0] : eventsField) ?? {};
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    eventName: (ev.name as string | null) ?? "Untitled event",
    eventDate: (ev.start_date as string | null) ?? "",
    startTime: (ev.start_time as string | null) ?? null,
    guestCount: (ev.guest_count as number | null) ?? 0,
    status: row.status as VndrBookingStatus,
    totalCents: (row.total_cents as number | null) ?? 0,
    vendorPayoutCents: (row.vendor_payout_cents as number | null) ?? 0,
    createdAt: row.created_at as string,
  };
}

export async function getVndrBookings(vendorTenantId: string): Promise<VndrBooking[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(COLS)
    .eq("vndr_tenant_id", vendorTenantId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}
