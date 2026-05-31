import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Marketplace browse read layer (V-2d). Reads the curated, published-only
 * views added by migration 078 (marketplace_vendors / _vendor_photos /
 * _vndr_packages / _venues / _venue_spaces) — never the base tables, which
 * are tenant-isolated by RLS and carry sensitive columns. The views expose
 * shopper-safe columns of published rows and are granted to authenticated.
 *
 * If migration 078 is not yet applied, the view reads return an error and we
 * degrade to an empty list (the grid shows its empty state) rather than throw.
 */

export type MarketplacePhoto = { url: string; alt: string | null };

export type MarketplacePackage = {
  id: string;
  name: string;
  priceCents: number | null;
  durationHours: number | null;
};

export type VendorListing = {
  tenantId: string;
  displayName: string;
  category: string | null;
  subType: string | null;
  city: string | null;
  startingPriceCents: number | null;
  photos: MarketplacePhoto[];
  packages: MarketplacePackage[];
};

export type VenueSpace = {
  id: string;
  name: string;
  capacity: number | null;
  ratePerDayCents: number | null;
};

export type VenueListing = {
  tenantId: string;
  displayName: string;
  city: string | null;
  state: string | null;
  coiVerified: boolean;
  propertyVerified: boolean;
  spaces: VenueSpace[];
};

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const bucket = out.get(k);
    if (bucket) bucket.push(row);
    else out.set(k, [row]);
  }
  return out;
}

export async function getMarketplaceVendors(): Promise<VendorListing[]> {
  const supabase = await createClient();

  const [vendorsRes, photosRes, packagesRes] = await Promise.all([
    supabase
      .from("marketplace_vendors")
      .select(
        "tenant_id, display_name, primary_category, primary_sub_type, city, starting_price_cents",
      ),
    supabase
      .from("marketplace_vendor_photos")
      .select("tenant_id, storage_path, alt_text, display_order")
      .order("display_order", { ascending: true }),
    supabase
      .from("marketplace_vndr_packages")
      .select("id, tenant_id, name, price_cents, duration_hours, display_order")
      .order("display_order", { ascending: true }),
  ]);

  const vendorRows = (vendorsRes.data ?? []) as Record<string, unknown>[];
  const photoRows = (photosRes.data ?? []) as Record<string, unknown>[];
  const packageRows = (packagesRes.data ?? []) as Record<string, unknown>[];

  const photosByTenant = groupBy(photoRows, (r) => r.tenant_id as string);
  const packagesByTenant = groupBy(packageRows, (r) => r.tenant_id as string);

  return vendorRows
    .map((row): VendorListing => {
      const tenantId = row.tenant_id as string;
      const photos = (photosByTenant.get(tenantId) ?? []).map((p) => {
        const { data: pub } = supabase.storage
          .from("vendor-photos")
          .getPublicUrl(p.storage_path as string);
        return { url: pub.publicUrl, alt: (p.alt_text as string | null) ?? null };
      });
      const packages = (packagesByTenant.get(tenantId) ?? []).map((pk) => ({
        id: pk.id as string,
        name: pk.name as string,
        priceCents: (pk.price_cents as number | null) ?? null,
        durationHours: (pk.duration_hours as number | null) ?? null,
      }));
      return {
        tenantId,
        displayName: row.display_name as string,
        category: (row.primary_category as string | null) ?? null,
        subType: (row.primary_sub_type as string | null) ?? null,
        city: (row.city as string | null) ?? null,
        startingPriceCents: (row.starting_price_cents as number | null) ?? null,
        photos,
        packages,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getMarketplaceVenues(): Promise<VenueListing[]> {
  const supabase = await createClient();

  const [venuesRes, spacesRes] = await Promise.all([
    supabase
      .from("marketplace_venues")
      .select(
        "tenant_id, display_name, city, state, coi_verified, property_record_verified",
      ),
    supabase
      .from("marketplace_venue_spaces")
      .select("id, tenant_id, name, capacity, rate_per_day_cents"),
  ]);

  const venueRows = (venuesRes.data ?? []) as Record<string, unknown>[];
  const spaceRows = (spacesRes.data ?? []) as Record<string, unknown>[];
  const spacesByTenant = groupBy(spaceRows, (r) => r.tenant_id as string);

  return venueRows
    .map((row): VenueListing => {
      const tenantId = row.tenant_id as string;
      const spaces = (spacesByTenant.get(tenantId) ?? []).map((sp) => ({
        id: sp.id as string,
        name: sp.name as string,
        capacity: (sp.capacity as number | null) ?? null,
        ratePerDayCents: (sp.rate_per_day_cents as number | null) ?? null,
      }));
      return {
        tenantId,
        displayName: row.display_name as string,
        city: (row.city as string | null) ?? null,
        state: (row.state as string | null) ?? null,
        coiVerified: Boolean(row.coi_verified),
        propertyVerified: Boolean(row.property_record_verified),
        spaces,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}
