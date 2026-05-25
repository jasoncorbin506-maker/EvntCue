import "server-only";
import { createClient } from "@/lib/supabase/server";
import { VNDR_RESPONSE_SLA_HOURS } from "@/lib/vndr/oldest-unresponded-inquiry";

/**
 * Active pipeline rows for the Vndr Home Active section (brief §4). Returns
 * up to 5 rows merged across inquiries + bookings, sorted by urgency:
 *
 *   - Inquiries: urgent when response window has <4h remaining
 *   - Bookings: urgent when payment deadline <48h OR event date <7 days
 *
 * Single sortable list with a `kind` discriminator on each row; component
 * renders inquiries + bookings with their own visual treatments + actions.
 */

export type ActiveInquiryRow = {
  kind: "inquiry";
  id: string;
  eventName: string;
  eventDate: string;
  guestCount: number;
  proposedPriceCents: number | null;
  badge: "urgent" | "new" | "reviewing";
  hoursRemaining: number;
};

export type ActiveBookingRow = {
  kind: "booking";
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  guestCount: number;
  totalCents: number;
  badge: "confirmed" | "upcoming";
  daysUntilEvent: number;
};

export type ActivePipelineRow = ActiveInquiryRow | ActiveBookingRow;

const URGENT_INQUIRY_HOURS = 4;
const UPCOMING_BOOKING_DAYS = 7;

export async function getVndrActivePipeline(
  vendorTenantId: string,
  limit: number = 5,
): Promise<ActivePipelineRow[]> {
  const supabase = await createClient();
  const now = Date.now();

  const inquiriesPromise = supabase
    .from("booking_inquiries")
    .select(
      "id, event_date, guest_count, proposed_price_cents, status, created_at, responded_at, events!booking_inquiries_event_id_fkey(name)",
    )
    .eq("vndr_tenant_id", vendorTenantId)
    .in("status", ["inquiry", "reviewing", "quoted"])
    .order("created_at", { ascending: false })
    .limit(20);

  const bookingsPromise = supabase
    .from("bookings")
    .select(
      "id, event_id, total_cents, status, events!bookings_event_id_fkey!inner(name, start_date, guest_count)",
    )
    .eq("vndr_tenant_id", vendorTenantId)
    .in("status", ["confirmed", "pending"])
    .order("created_at", { ascending: false })
    .limit(20);

  const [inquiriesRes, bookingsRes] = await Promise.all([
    inquiriesPromise,
    bookingsPromise,
  ]);

  const inquiries: ActiveInquiryRow[] = (inquiriesRes.data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const createdAt = row.created_at as string;
    const createdMs = new Date(createdAt).getTime();
    const deadlineMs =
      createdMs + VNDR_RESPONSE_SLA_HOURS * 60 * 60 * 1000;
    const hoursRemaining = Math.max(0, (deadlineMs - now) / (1000 * 60 * 60));
    const status = row.status as string;
    const responded = row.responded_at != null;
    let badge: ActiveInquiryRow["badge"] = "new";
    if (!responded && hoursRemaining < URGENT_INQUIRY_HOURS) badge = "urgent";
    else if (status === "reviewing" || status === "quoted") badge = "reviewing";
    const eventsField = row.events as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null;
    const ev = (Array.isArray(eventsField) ? eventsField[0] : eventsField) ?? {};
    return {
      kind: "inquiry",
      id: row.id as string,
      eventName: (ev.name as string | null) ?? "Untitled inquiry",
      eventDate: (row.event_date as string | null) ?? "",
      guestCount: (row.guest_count as number | null) ?? 0,
      proposedPriceCents:
        (row.proposed_price_cents as number | null) ?? null,
      badge,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    };
  });

  const bookings: ActiveBookingRow[] = (bookingsRes.data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const eventsField = row.events as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null;
    const ev = (Array.isArray(eventsField) ? eventsField[0] : eventsField) ?? {};
    const eventDate = (ev.start_date as string | null) ?? "";
    const daysUntilEvent = eventDate
      ? Math.ceil(
          (new Date(eventDate).getTime() - now) / (1000 * 60 * 60 * 24),
        )
      : Number.POSITIVE_INFINITY;
    const badge: ActiveBookingRow["badge"] =
      daysUntilEvent <= UPCOMING_BOOKING_DAYS && daysUntilEvent >= 0
        ? "upcoming"
        : "confirmed";
    return {
      kind: "booking",
      id: row.id as string,
      eventId: row.event_id as string,
      eventName: (ev.name as string | null) ?? "Untitled event",
      eventDate,
      guestCount: (ev.guest_count as number | null) ?? 0,
      totalCents: (row.total_cents as number | null) ?? 0,
      badge,
      daysUntilEvent,
    };
  });

  // Merge + sort by urgency: urgent inquiries > upcoming bookings > new
  // inquiries > confirmed bookings > reviewing inquiries.
  function priority(row: ActivePipelineRow): number {
    if (row.kind === "inquiry" && row.badge === "urgent") return 0;
    if (row.kind === "booking" && row.badge === "upcoming") return 1;
    if (row.kind === "inquiry" && row.badge === "new") return 2;
    if (row.kind === "booking" && row.badge === "confirmed") return 3;
    return 4;
  }

  const merged: ActivePipelineRow[] = [...inquiries, ...bookings].sort(
    (a, b) => priority(a) - priority(b),
  );
  return merged.slice(0, limit);
}
