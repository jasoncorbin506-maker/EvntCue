import { createClient } from "@/lib/supabase/server";

export type MoneyPeriod = "this-month" | "ytd" | "all-time";

export type MoneyBreakdown = {
  period: MoneyPeriod;
  periodLabel: string;
  bookingCount: number;
  grossRevenueCents: number;
  platformFeeCents: number;
  vendorReferralPaidCents: number;
  commissionPaidCents: number;
  netRevenueCents: number;
};

/**
 * Resolve a MoneyPeriod into an ISO date range against events.start_date.
 * Returns [startIso, endIso] inclusive of start, exclusive of end (standard
 * half-open interval). For "all-time" returns sentinel dates that include
 * everything reasonable.
 *
 * Per F4.b in decisions-log/2026-05-23-event-start-time-architecture.md —
 * money periods are operational, so boundaries are computed in the event-
 * local timezone (not the server's TZ, which on Vercel = UTC and would
 * silently misbehave at month boundaries for CST users). Defaults to
 * 'America/Chicago' to match the `events.timezone` DEFAULT from migration
 * 001 — once venues store their own TZ, callers pass it through.
 *
 * Note: events.start_date is a DATE column (no TZ), so the actual filter
 * comparison is TZ-agnostic — a wedding on "2026-05-15" is on May 15 in
 * every TZ. The TZ-awareness here is purely about WHICH MONTH IS "NOW" —
 * i.e., what calendar boundaries we derive from the wall-clock moment of
 * the request.
 */
function periodToRange(
  period: MoneyPeriod,
  tz: string = "America/Chicago",
  today: Date = new Date(),
): [string, string] {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(today);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const y = get("year");
  const m = get("month") - 1; // 0-indexed
  const pad = (n: number) => String(n).padStart(2, "0");

  if (period === "this-month") {
    const startIso = `${y}-${pad(m + 1)}-01`;
    const endIso = m === 11
      ? `${y + 1}-01-01`
      : `${y}-${pad(m + 2)}-01`;
    return [startIso, endIso];
  }
  if (period === "ytd") {
    return [`${y}-01-01`, `${y + 1}-01-01`];
  }
  // all-time: 100 years back to 100 years forward
  return ["1900-01-01", "2100-01-01"];
}

const PERIOD_LABELS: Record<MoneyPeriod, string> = {
  "this-month": "This month",
  "ytd": "Year to date",
  "all-time": "All time",
};

/**
 * Venue net-revenue aggregation across bookings within the period window.
 *
 * Data model: aggregates from `bookings` columns directly (gross subtotal
 * minus platform fee minus referrals minus other commissions). The richer
 * per-flow breakdown lives in `commission_flows` and will wire when those
 * rows actually populate (Phase 4 Stripe webhook era). For now,
 * bookings-derived numbers are accurate and honest for the venue's view.
 *
 * Period filter uses events.start_date — "revenue from events occurring in
 * the period." Cancelled bookings are excluded; pending/confirmed/completed
 * all count (a confirmed booking IS committed revenue from the venue's POV).
 */
export async function getVenueMoney(
  tenantId: string,
  period: MoneyPeriod,
  /**
   * Per F4.b — venue TZ for period-boundary computation. Defaults to
   * 'America/Chicago' (the events.timezone DEFAULT from migration 001 +
   * the DFW center of mass). When venues get their own .timezone column
   * (post-V-1b polish), the Money page caller passes it through here.
   */
  tz?: string,
): Promise<MoneyBreakdown> {
  const [startIso, endIso] = periodToRange(period, tz);
  const supabase = await createClient();

  // Embed events!bookings_event_id_fkey!inner to disambiguate the two FKs
  // between bookings and events (same pattern as the Bookings tab wire).
  const { data } = await supabase
    .from("bookings")
    .select(
      "subtotal_cents, platform_fee_cents, vndr_referral_amount_cents, commission_amount_cents, status, events!bookings_event_id_fkey!inner(start_date)",
    )
    .eq("vndr_tenant_id", tenantId)
    .neq("status", "cancelled");

  const rows = (data ?? []) as Array<Record<string, unknown>>;

  let bookingCount = 0;
  let grossRevenueCents = 0;
  let platformFeeCents = 0;
  let vendorReferralPaidCents = 0;
  let commissionPaidCents = 0;

  for (const row of rows) {
    const eventsField = row.events as Record<string, unknown> | Record<string, unknown>[] | null;
    const ev = (Array.isArray(eventsField) ? eventsField[0] : eventsField) ?? {};
    const startDate = ev.start_date as string | null;
    if (!startDate) continue;
    if (startDate < startIso || startDate >= endIso) continue;

    bookingCount += 1;
    grossRevenueCents += (row.subtotal_cents as number | null) ?? 0;
    platformFeeCents += (row.platform_fee_cents as number | null) ?? 0;
    vendorReferralPaidCents += (row.vndr_referral_amount_cents as number | null) ?? 0;
    commissionPaidCents += (row.commission_amount_cents as number | null) ?? 0;
  }

  const netRevenueCents = Math.max(
    0,
    grossRevenueCents - platformFeeCents - vendorReferralPaidCents - commissionPaidCents,
  );

  return {
    period,
    periodLabel: PERIOD_LABELS[period],
    bookingCount,
    grossRevenueCents,
    platformFeeCents,
    vendorReferralPaidCents,
    commissionPaidCents,
    netRevenueCents,
  };
}

export function isValidPeriod(value: string | null | undefined): value is MoneyPeriod {
  return value === "this-month" || value === "ytd" || value === "all-time";
}
