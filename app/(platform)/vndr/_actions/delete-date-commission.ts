"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * V-2b smoke-fix (session 23 — per-date commission lock): remove a
 * vendor's commission-rate override for a specific date. After delete,
 * that date falls back to the vendor's default commission rate (their
 * vendors.referral_rate_pct).
 *
 * Keyed by (tenant_id, override_date) — the unique tuple. RLS gates the
 * delete to the vendor's own tenant.
 */

export type DeleteDateCommissionResult =
  | { ok: true; deleted: boolean }
  | { ok: false; error: string };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function deleteDateCommission(
  date: string,
): Promise<DeleteDateCommissionResult> {
  if (!ISO_DATE_RE.test(date)) {
    return { ok: false, error: "Date must be YYYY-MM-DD." };
  }

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("vendor_date_commission_overrides")
    .delete({ count: "exact" })
    .eq("tenant_id", vendor.tenantId)
    .eq("override_date", date);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vndr");
  return { ok: true, deleted: (count ?? 0) > 0 };
}
