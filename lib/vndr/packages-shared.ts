/**
 * Client-safe types + utilities for vendor packages. Split out from
 * lib/vndr/packages.ts during the V-2b smoke-fix (session 23, 2026-05-25)
 * because Next.js 16's strict `import "server-only"` check fails the build
 * when a `server-only` module ends up in a Client Component import graph.
 *
 * Anything in this file is safe to import from a "use client" component.
 * The server-side read (getVndrPackages) stays in packages.ts and is
 * server-only.
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
