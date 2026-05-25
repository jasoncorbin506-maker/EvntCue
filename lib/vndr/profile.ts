import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Full vendor profile read for the Profile tab. Returns the editable fields
 * from the vendors row PLUS the photo list PLUS the certifications list.
 * lib/vndr/current-vendor.ts continues to be the lightweight session
 * resolver used elsewhere; this is the heavier read for the Profile tab.
 *
 * RLS scopes results to the vendor's own tenant. Photos read order: stable
 * by display_order ASC, then created_at ASC. Certifications are
 * read-only here — upload/verify flow is separate from V-2b.
 */

export type VendorProfile = {
  id: string;
  tenantId: string;
  displayName: string;
  legalBusinessName: string | null;
  primaryCategory: string | null;
  primarySubType: string | null;
  city: string | null;
  serviceZips: string[];
  websiteUrl: string | null;
  foundingStory: string | null;
  yearsInBusiness: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  startingPriceCents: number | null;
  referralRatePct: number | null;
  pricingModel: string | null;
  bookingMode: string | null;
};

export type VendorPhoto = {
  id: string;
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  displayOrder: number;
};

export type VendorCertification = {
  id: string;
  certType: string;
  fileUrl: string;
  verified: boolean;
  issuedDate: string | null;
  expiryDate: string | null;
};

const VENDOR_COLS =
  "id, tenant_id, display_name, legal_business_name, primary_category, primary_sub_type, city, service_zips, website_url, founding_story, years_in_business, contact_email, contact_phone, starting_price_cents, referral_rate_pct, pricing_model, booking_mode";

function shapeVendor(row: Record<string, unknown>): VendorProfile {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    displayName: row.display_name as string,
    legalBusinessName: (row.legal_business_name as string | null) ?? null,
    primaryCategory: (row.primary_category as string | null) ?? null,
    primarySubType: (row.primary_sub_type as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    serviceZips: Array.isArray(row.service_zips) ? (row.service_zips as string[]) : [],
    websiteUrl: (row.website_url as string | null) ?? null,
    foundingStory: (row.founding_story as string | null) ?? null,
    yearsInBusiness: (row.years_in_business as number | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    startingPriceCents: (row.starting_price_cents as number | null) ?? null,
    referralRatePct:
      row.referral_rate_pct === null || row.referral_rate_pct === undefined
        ? null
        : Number(row.referral_rate_pct),
    pricingModel: (row.pricing_model as string | null) ?? null,
    bookingMode: (row.booking_mode as string | null) ?? null,
  };
}

export async function getVendorProfile(
  tenantId: string,
): Promise<VendorProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendors")
    .select(VENDOR_COLS)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? shapeVendor(data as Record<string, unknown>) : null;
}

/**
 * Fetch photo metadata + mint public URLs for the bucket. Bucket is public
 * (per migration 056), so getPublicUrl returns a stable display URL — no
 * signing needed.
 */
export async function getVendorPhotos(
  tenantId: string,
): Promise<VendorPhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendor_photos")
    .select("id, storage_path, alt_text, display_order")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const storagePath = r.storage_path as string;
    const { data: pub } = supabase.storage
      .from("vendor-photos")
      .getPublicUrl(storagePath);
    return {
      id: r.id as string,
      storagePath,
      publicUrl: pub.publicUrl,
      altText: (r.alt_text as string | null) ?? null,
      displayOrder: r.display_order as number,
    };
  });
}

export async function getVendorCertifications(
  tenantId: string,
): Promise<VendorCertification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_certifications")
    .select("id, cert_type, file_url, verified, issued_date, expiry_date")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      certType: r.cert_type as string,
      fileUrl: r.file_url as string,
      verified: r.verified as boolean,
      issuedDate: (r.issued_date as string | null) ?? null,
      expiryDate: (r.expiry_date as string | null) ?? null,
    };
  });
}
