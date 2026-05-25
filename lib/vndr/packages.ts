import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Vendor packages + addons (migrations 052 + 053). Per Jason's 2026-05-24
 * lock: flat + sub-items table. Each package is a top-level row; addons are
 * optional sub-items priced on top.
 *
 * V-2b ships read + simple field-update server actions (price, referral_pct,
 * is_visible). Full edit-in-place + addon CRUD UI lands in Session B's
 * Profile tab build-out.
 */

export type VndrPackage = {
  id: string;
  vendorTenantId: string;
  name: string;
  description: string | null;
  priceCents: number;
  referralPct: number;
  isVisible: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  addons: VndrPackageAddon[];
};

export type VndrPackageAddon = {
  id: string;
  packageId: string;
  name: string;
  description: string | null;
  priceCents: number;
  displayOrder: number;
};

const PKG_COLS =
  "id, vendor_tenant_id, name, description, price_cents, referral_pct, is_visible, display_order, created_at, updated_at";
const ADDON_COLS =
  "id, package_id, name, description, price_cents, display_order";

function shapePackage(
  row: Record<string, unknown>,
  addons: VndrPackageAddon[],
): VndrPackage {
  return {
    id: row.id as string,
    vendorTenantId: row.vendor_tenant_id as string,
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
    .from("vendor_packages")
    .select(PKG_COLS)
    .eq("vendor_tenant_id", vendorTenantId)
    .order("display_order", { ascending: true });
  const packages = pkgRows ?? [];
  if (packages.length === 0) return [];

  const packageIds = packages.map((p) => (p as Record<string, unknown>).id as string);
  const { data: addonRows } = await supabase
    .from("vendor_package_addons")
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

/**
 * Derive a 'low'/'medium'/'high' visibility tier from referral % + visibility
 * flag. V-2a hardcoded this; V-2b derives it so the slider updates the bar.
 * Tiers: invisible OR <10% = low; 10–19% = medium; 20%+ = high.
 *
 * The real visibility formula (per V-2a doc comment) is "price × referral %
 * × trust score × category demand" — Phase 4 territory. For V-2b we use
 * referral % as the dominant signal so the slider feels responsive.
 */
export function visibilityTier(pkg: VndrPackage): "low" | "medium" | "high" {
  if (!pkg.isVisible) return "low";
  if (pkg.referralPct >= 20) return "high";
  if (pkg.referralPct >= 10) return "medium";
  return "low";
}
