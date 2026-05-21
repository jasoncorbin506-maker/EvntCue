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
 */
function periodToRange(period: MoneyPeriod, today: Date = new Date()): [string, string] {
  const y = today.getFullYear();
  const m = today.getMonth();
  if (period === "this-month") {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);
    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
  }
  if (period === "ytd") {
    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);
    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
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
): Promise<MoneyBreakdown> {
  const [startIso, endIso] = periodToRange(period);
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
