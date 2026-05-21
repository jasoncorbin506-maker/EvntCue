import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/labels/booking-status";

export type VenuBooking = {
  eventId: string;
  bookingId: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  guestCount: number;
  spaceLabel: string;
  netRevenueCents: number;
  status: BookingStatus;
};

// PostgREST embed disambiguation: there are two FKs between bookings and
// events — `bookings.event_id → events.id` (forward, what we want) and
// `events.venue_booking_id → bookings.id` (reverse, back-pointer). Without
// naming the constraint, PostgREST errors with PGRST201. Use the auto-named
// constraint `bookings_event_id_fkey` to anchor the embed to the forward FK.
const COLS =
  "id, event_id, vndr_tenant_id, status, subtotal_cents, platform_fee_cents, vndr_referral_amount_cents, commission_amount_cents, events!bookings_event_id_fkey!inner(name, start_date, start_time, guest_count)";

/**
 * Format a Postgres TIME string (HH:MM:SS) into a "5:30 PM" display.
 * Returns "TBD" when the event has no start_time set.
 */
function formatStartTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "TBD";
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");
  if (Number.isNaN(h)) return "TBD";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}:00 ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Venue net revenue = subtotal − platform fee − any commissions paid out.
 * Tax flows through to the state, not the venue, so it's excluded.
 * Stored vendor_payout_cents would be canonical post-Phase-4; until then
 * we compute from the row's own line items.
 */
function netRevenue(row: Record<string, unknown>): number {
  const subtotal = (row.subtotal_cents as number | null) ?? 0;
  const platform = (row.platform_fee_cents as number | null) ?? 0;
  const referral = (row.vndr_referral_amount_cents as number | null) ?? 0;
  const commission = (row.commission_amount_cents as number | null) ?? 0;
  return Math.max(0, subtotal - platform - referral - commission);
}

function shape(row: Record<string, unknown>, spaceLabel: string): VenuBooking {
  // Supabase nested-select returns events as a single object when !inner is used,
  // but the TS types still see it as `any[]` sometimes. Normalize.
  const eventsField = row.events as Record<string, unknown> | Record<string, unknown>[] | null;
  const ev = (Array.isArray(eventsField) ? eventsField[0] : eventsField) ?? {};
  return {
    eventId: row.event_id as string,
    bookingId: row.id as string,
    eventName: (ev.name as string | null) ?? "Untitled event",
    eventDate: (ev.start_date as string | null) ?? "",
    startTime: formatStartTime(ev.start_time as string | null),
    guestCount: (ev.guest_count as number | null) ?? 0,
    spaceLabel,
    netRevenueCents: netRevenue(row),
    status: row.status as BookingStatus,
  };
}

export async function getVenueBookings(
  tenantId: string,
  spaceLabel: string,
): Promise<VenuBooking[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(COLS)
    .eq("vndr_tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => shape(row as Record<string, unknown>, spaceLabel));
}

export type VenuBookingGroupKey = "today" | "thisWeek" | "restOfMonth" | "upcoming";

export type VenuBookingGroup = {
  key: VenuBookingGroupKey;
  label: string;
  rows: VenuBooking[];
};

/**
 * Group bookings into Today / This week / Rest of month / Upcoming buckets,
 * anchored on the supplied today (defaults to now). The "upcoming" bucket
 * catches anything dated past the end of this month — important because the
 * Venu Bookings tab is a full inventory view, not just a day-of cockpit.
 * A wedding 11 months out still needs to surface here.
 *
 * Per session 18c-2 design note (Jason 2026-05-21): "if I need to change the
 * date of my wedding, the bookings tab should still show it" — the 3-bucket
 * original (today/thisWeek/restOfMonth) was a Day-Of pattern misapplied to
 * the inventory tab. This 4-bucket version closes that gap.
 */
export function groupVenuBookings(
  bookings: VenuBooking[],
  today: Date = new Date(),
): VenuBookingGroup[] {
  const todayIso = today.toISOString().slice(0, 10);
  const endOfThisWeek = new Date(today);
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
  endOfThisWeek.setDate(today.getDate() + daysUntilSunday);
  const endOfWeekIso = endOfThisWeek.toISOString().slice(0, 10);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const endOfMonthIso = endOfMonth.toISOString().slice(0, 10);

  const todayRows: VenuBooking[] = [];
  const weekRows: VenuBooking[] = [];
  const monthRows: VenuBooking[] = [];
  const upcomingRows: VenuBooking[] = [];

  for (const b of bookings) {
    if (!b.eventDate) continue;
    if (b.eventDate === todayIso) todayRows.push(b);
    else if (b.eventDate > todayIso && b.eventDate <= endOfWeekIso) weekRows.push(b);
    else if (b.eventDate > endOfWeekIso && b.eventDate <= endOfMonthIso) monthRows.push(b);
    else if (b.eventDate > endOfMonthIso) upcomingRows.push(b);
  }

  // Sort upcoming chronologically — the bucket can span months/years, so the
  // venue manager wants nearest-first, not whatever DB order returns.
  upcomingRows.sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  return [
    { key: "today", label: "Today", rows: todayRows },
    { key: "thisWeek", label: "This week", rows: weekRows },
    { key: "restOfMonth", label: "Rest of month", rows: monthRows },
    { key: "upcoming", label: "Upcoming", rows: upcomingRows },
  ];
}

export async function getVenueEventDetail(
  eventId: string,
  tenantId: string,
  spaceLabel: string,
): Promise<VenuBooking | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(COLS)
    .eq("event_id", eventId)
    .eq("vndr_tenant_id", tenantId)
    .limit(1);

  const row = data?.[0];
  if (!row) return null;
  return shape(row as Record<string, unknown>, spaceLabel);
}
