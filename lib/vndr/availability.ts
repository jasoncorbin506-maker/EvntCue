import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Vendor availability blocks (migration 051). Supports whole-day (start_time
 * / end_time both NULL) and partial-day blocks (both set, end > start).
 * Multiple rows per date allowed — vendor can block two windows on the same
 * day (e.g., 09:00–11:00 AND 18:00–22:00).
 *
 * Used by V-2b calendar-month.ts (read) + the AvailabilityBlockSheet
 * server actions (upsert + delete) for per-cell tap-to-block.
 */

export type VndrAvailabilityBlock = {
  id: string;
  vendorTenantId: string;
  blockedDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: string;
};

const COLS =
  "id, vendor_tenant_id, blocked_date, start_time, end_time, reason, created_at";

function shape(row: Record<string, unknown>): VndrAvailabilityBlock {
  return {
    id: row.id as string,
    vendorTenantId: row.vendor_tenant_id as string,
    blockedDate: row.blocked_date as string,
    startTime: (row.start_time as string | null) ?? null,
    endTime: (row.end_time as string | null) ?? null,
    reason: (row.reason as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

/**
 * Fetch all blocks for a vendor in a given month (YYYY-MM-01 → end of month).
 * Inclusive on both ends. ISO date strings keep DST + timezone math out of
 * scope; the calendar grid renders in viewer-local presentation.
 */
export async function getVndrAvailabilityBlocksForMonth(
  vendorTenantId: string,
  year: number,
  month: number,
): Promise<VndrAvailabilityBlock[]> {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  // End of month = first day of next month minus 1 day. Compute via JS Date
  // (UTC math is fine; we only care about the calendar date).
  const next = new Date(Date.UTC(year, month, 1));
  next.setUTCDate(next.getUTCDate() - 1);
  const end = next.toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data } = await supabase
    .from("vendor_availability_blocks")
    .select(COLS)
    .eq("vendor_tenant_id", vendorTenantId)
    .gte("blocked_date", start)
    .lte("blocked_date", end)
    .order("blocked_date", { ascending: true });
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

export async function getVndrAvailabilityBlocksForDate(
  vendorTenantId: string,
  isoDate: string,
): Promise<VndrAvailabilityBlock[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendor_availability_blocks")
    .select(COLS)
    .eq("vendor_tenant_id", vendorTenantId)
    .eq("blocked_date", isoDate)
    .order("start_time", { ascending: true, nullsFirst: true });
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}
