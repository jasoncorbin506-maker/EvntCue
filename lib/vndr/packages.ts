import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { VndrPackage, VndrPackageAddon } from "@/lib/vndr/packages-shared";

/**
 * Vendor packages + addons — server-side read. Per Jason's 2026-05-24 lock:
 * flat + sub-items table. Each package is a top-level row; addons are
 * optional sub-items priced on top.
 *
 * Source tables (post-2026-05-25 consolidation, migration 054):
 *   - public.vndr_packages       — legacy survivor (migration 007), absorbed
 *                                  V-2b columns (is_visible, display_order,
 *                                  updated_at, created_by) + referral_rate_pct
 *                                  renamed to referral_pct + CHECK widened 0-100.
 *   - public.vndr_package_addons — new child table (migration 054), gated via
 *                                  user_owns_vndr_package() helper.
 *
 * Types + the client-safe `visibilityTier` helper live in
 * `lib/vndr/packages-shared.ts` so Client Components can import them
 * without dragging `server-only` into the client bundle (V-2b smoke-fix
 * session 23 — Next.js 16 strict server-only check broke the Vercel
 * build until the split). Re-exported below for back-compat.
 */

export type { VndrPackage, VndrPackageAddon } from "@/lib/vndr/packages-shared";
export { visibilityTier } from "@/lib/vndr/packages-shared";

const PKG_COLS =
  "id, tenant_id, name, description, price_cents, referral_pct, is_visible, display_order, created_at, updated_at";
const ADDON_COLS =
  "id, package_id, name, description, price_cents, display_order";

function shapePackage(
  row: Record<string, unknown>,
  addons: VndrPackageAddon[],
): VndrPackage {
  return {
    id: row.id as string,
    vendorTenantId: row.tenant_id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    priceCents: row.price_cents as number,
    // Postgres NUMERIC comes back as a string over the wire; coerce to number.
    referralPct: Number(row.referral_pct),
    isVisible: row.is_visible as boolean,
    displayOrder: row.display_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    addons,
  };
}

function shapeAddon(row: Record<string, unknown>): VndrPackageAddon {
  return {
    id: row.id as string,
    packageId: row.package_id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    priceCents: row.price_cents as number,
    displayOrder: row.display_order as number,
  };
}

/**
 * Fetch a vendor's full package catalog with addons nested. Two queries
 * (packages, then addons by package_id IN (...)) — single round-trip via
 * Promise.all would still need two RLS gates. PostgREST embed is the third
 * option but the explicit two-step is easier to reason about for the count
 * of packages V-2b expects (<20 per vendor).
 */
export async function getVndrPackages(vendorTenantId: string): Promise<VndrPackage[]> {
  const supabase = await createClient();
  const { data: pkgRows } = await supabase
    .from("vndr_packages")
    .select(PKG_COLS)
    .eq("tenant_id", vendorTenantId)
    .order("display_order", { ascending: true });
  const packages = pkgRows ?? [];
  if (packages.length === 0) return [];

  const packageIds = packages.map((p) => (p as Record<string, unknown>).id as string);
  const { data: addonRows } = await supabase
    .from("vndr_package_addons")
    .select(ADDON_COLS)
    .in("package_id", packageIds)
    .order("display_order", { ascending: true });

  const addonsByPackage = new Map<string, VndrPackageAddon[]>();
  for (const a of addonRows ?? []) {
    const shaped = shapeAddon(a as Record<string, unknown>);
    const arr = addonsByPackage.get(shaped.packageId) ?? [];
    arr.push(shaped);
    addonsByPackage.set(shaped.packageId, arr);
  }

  return packages.map((p) =>
    shapePackage(
      p as Record<string, unknown>,
      addonsByPackage.get((p as Record<string, unknown>).id as string) ?? [],
    ),
  );
}
