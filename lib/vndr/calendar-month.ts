import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getVndrAvailabilityBlocksForMonth } from "@/lib/vndr/availability";

/**
 * Vendor Home Mini Calendar — month grid data per V-2b brief §6. Returns
 * one entry per day-of-month (1..N) with a derived state:
 *
 *   - booked   → vendor has a confirmed/completed booking on that date
 *   - inquiry  → vendor has an open inquiry (inquiry|reviewing|quoted)
 *   - blocked  → vendor has an availability block (whole or partial day)
 *   - open     → none of the above
 *
 * Precedence when multiple apply on the same date: booked > inquiry > blocked
 * > open. (A booked date is a booked date even if there's also a stale
 * inquiry sitting around.)
 *
 * Partial-day blocks set state=blocked the same as whole-day blocks for V-2b;
 * the per-cell tap sheet surfaces the time-of-day detail. A `partial` boolean
 * is included so the UI can render half-fill vs full-fill.
 */

export type CalendarCellState = "booked" | "inquiry" | "blocked" | "open";

export type CalendarCell = {
  day: number;
  date: string;
  state: CalendarCellState;
  partial: boolean;
};

export type CalendarMonth = {
  year: number;
  month: number;
  cells: CalendarCell[];
  firstDayOfWeek: number;
};

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export async function getVndrCalendarMonth(
  vendorTenantId: string,
  year: number,
  month: number,
): Promise<CalendarMonth> {
  const supabase = await createClient();
  const start = isoDate(year, month, 1);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = isoDate(year, month, lastDay);

  const blocksPromise = getVndrAvailabilityBlocksForMonth(
    vendorTenantId,
    year,
    month,
  );

  const bookingsPromise = supabase
    .from("bookings")
    .select("status, events!bookings_event_id_fkey!inner(start_date)")
    .eq("vndr_tenant_id", vendorTenantId)
    .in("status", ["confirmed", "completed"])
    .gte("events.start_date", start)
    .lte("events.start_date", end);

  const inquiriesPromise = supabase
    .from("booking_inquiries")
    .select("event_date, status")
    .eq("vndr_tenant_id", vendorTenantId)
    .in("status", ["inquiry", "reviewing", "quoted"])
    .gte("event_date", start)
    .lte("event_date", end);

  const [blocks, bookingsRes, inquiriesRes] = await Promise.all([
    blocksPromise,
    bookingsPromise,
    inquiriesPromise,
  ]);

  const bookedDates = new Set<string>();
  for (const b of bookingsRes.data ?? []) {
    const row = b as Record<string, unknown>;
    const eventsField = row.events as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null;
    const ev = (Array.isArray(eventsField) ? eventsField[0] : eventsField) ?? {};
    const d = ev.start_date as string | null;
    if (d) bookedDates.add(d);
  }

  const inquiryDates = new Set<string>();
  for (const i of inquiriesRes.data ?? []) {
    const row = i as Record<string, unknown>;
    const d = row.event_date as string | null;
    if (d) inquiryDates.add(d);
  }

  // Map date → { hasWhole, hasPartial }
  const blockMap = new Map<string, { whole: boolean; partial: boolean }>();
  for (const blk of blocks) {
    const existing = blockMap.get(blk.blockedDate) ?? {
      whole: false,
      partial: false,
    };
    if (blk.startTime === null && blk.endTime === null) existing.whole = true;
    else existing.partial = true;
    blockMap.set(blk.blockedDate, existing);
  }

  const cells: CalendarCell[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const date = isoDate(year, month, day);
    let state: CalendarCellState = "open";
    let partial = false;
    if (bookedDates.has(date)) state = "booked";
    else if (inquiryDates.has(date)) state = "inquiry";
    else if (blockMap.has(date)) {
      state = "blocked";
      const blk = blockMap.get(date)!;
      partial = blk.partial && !blk.whole;
    }
    cells.push({ day, date, state, partial });
  }

  // First day-of-week index (0=Sunday) for grid leading-blanks.
  const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  return { year, month, cells, firstDayOfWeek };
}
