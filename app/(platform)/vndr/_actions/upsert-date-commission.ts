"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * V-2b smoke-fix (session 23 — Jason's per-date commission lock): create
 * or update a vendor's commission-rate override for a specific date.
 * Vendor-wide for V-2b (applies to all the vendor's packages on that date);
 * per-package per-date granularity is V-2c. One row per (tenant, date) —
 * UNIQUE constraint vdco_unique_tenant_date enforces this.
 *
 * Upserts by (tenant_id, override_date) tuple — if a row exists for that
 * date, the commission_pct + note are updated; otherwise a new row is
 * inserted. Vendor's authed user gets stamped into created_by on insert
 * (no-op on update — created_by tracks the original author).
 */

export type UpsertDateCommissionInput = {
  date: string; // YYYY-MM-DD
  commissionPct: number;
  note?: string | null;
};

export type UpsertDateCommissionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function upsertDateCommission(
  input: UpsertDateCommissionInput,
): Promise<UpsertDateCommissionResult> {
  if (!ISO_DATE_RE.test(input.date)) {
    return { ok: false, error: "Date must be YYYY-MM-DD." };
  }
  if (
    !Number.isFinite(input.commissionPct) ||
    input.commissionPct < 0 ||
    input.commissionPct > 100
  ) {
    return { ok: false, error: "Commission must be between 0 and 100." };
  }

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const note = input.note?.trim() || null;
  if (note && note.length > 200) {
    return { ok: false, error: "Note too long (200 max)." };
  }

  // Upsert keyed by (tenant_id, override_date) — vdco_unique_tenant_date.
  const { data, error } = await supabase
    .from("vendor_date_commission_overrides")
    .upsert(
      {
        tenant_id: vendor.tenantId,
        override_date: input.date,
        commission_pct: input.commissionPct,
        note,
        created_by: user.id,
      },
      { onConflict: "tenant_id,override_date" },
    )
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Update failed." };
  }
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
