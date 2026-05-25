import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Vendor per-date commission overrides (migration 057, V-2b smoke-fix
 * session 23). One row per (vendor tenant, override_date) tuple — vendor
 * can set a custom commission rate for a specific date (e.g. Mother's Day
 * = 15% instead of normal 20%).
 *
 * Vendor-wide for V-2b: the override applies to ALL the vendor's packages
 * on that date. Per-package per-date refinement is V-2c. Recurrence
 * (annual / floating holidays / weekly patterns) is V-2c.
 *
 * Reads via lib/vndr/calendar-month.ts (merged into CalendarCell) +
 * AvailabilityBlockSheet (for inline edit). Writes via the
 * upsert-date-commission + delete-date-commission server actions.
 */

export type VendorDateCommissionOverride = {
  id: string;
  overrideDate: string;
  commissionPct: number;
  note: string | null;
};

const COLS = "id, override_date, commission_pct, note";

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shape(row: Record<string, unknown>): VendorDateCommissionOverride {
  return {
    id: row.id as string,
    overrideDate: row.override_date as string,
    // Postgres NUMERIC comes back as string over the wire; coerce to number.
    commissionPct: Number(row.commission_pct),
    note: (row.note as string | null) ?? null,
  };
}

/**
 * Fetch all date overrides for a vendor across a given month. Used by
 * calendar-month to flag cells with overrides (small "$" marker) + by
 * AvailabilityBlockSheet for inline edit.
 */
export async function getVendorDateCommissionsForMonth(
  vendorTenantId: string,
  year: number,
  month: number,
): Promise<VendorDateCommissionOverride[]> {
  const supabase = await createClient();
  const start = isoDate(year, month, 1);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = isoDate(year, month, lastDay);

  const { data } = await supabase
    .from("vendor_date_commission_overrides")
    .select(COLS)
    .eq("tenant_id", vendorTenantId)
    .gte("override_date", start)
    .lte("override_date", end)
    .order("override_date", { ascending: true });

  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

/**
 * Fetch the override (if any) for a single date. Used by AvailabilityBlockSheet
 * when opening for a specific date — saves a round-trip via the page's
 * already-loaded month data, but this exists as a fallback for any client
 * caller that needs a fresh single-date read.
 */
export async function getVendorDateCommission(
  vendorTenantId: string,
  date: string,
): Promise<VendorDateCommissionOverride | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendor_date_commission_overrides")
    .select(COLS)
    .eq("tenant_id", vendorTenantId)
    .eq("override_date", date)
    .maybeSingle();
  return data ? shape(data as Record<string, unknown>) : null;
}
