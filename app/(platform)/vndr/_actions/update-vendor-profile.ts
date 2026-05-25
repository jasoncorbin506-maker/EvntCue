"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * V-2b Session B: partial-update a vendor's profile fields. Server-side
 * patch with input validation. RLS gates the actual write to the vendor's
 * own tenant.
 *
 * Per-field validation:
 *   - displayName: 1–80 chars trimmed
 *   - legalBusinessName: optional, ≤120 chars
 *   - city: optional, ≤80 chars
 *   - websiteUrl: optional, must start with http(s):// when present
 *   - foundingStory: optional, ≤2000 chars (the "bio" field)
 *   - yearsInBusiness: optional, 0–100 integer
 *   - contactEmail: optional, basic shape check (@.)
 *   - contactPhone: optional, ≤32 chars
 *   - serviceZips: optional, ≤25 entries, each 5-digit or 5+4
 *   - startingPriceCents: optional, 0–100_000_000 integer
 *   - referralRatePct: optional, 0–25 (vendor-onboarding CHECK on vendors.referral_rate_pct)
 *
 * Note: vendors.referral_rate_pct is the vendor-profile commission rate;
 * vndr_packages.referral_pct (renamed in mig 054) is the per-package
 * referral. Different columns, different ranges.
 */

export type UpdateVendorProfileInput = {
  displayName?: string;
  legalBusinessName?: string | null;
  city?: string | null;
  websiteUrl?: string | null;
  foundingStory?: string | null;
  yearsInBusiness?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  serviceZips?: string[];
  startingPriceCents?: number | null;
  referralRatePct?: number | null;
};

export type UpdateVendorProfileResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const ZIP_RE = /^\d{5}(-\d{4})?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateVendorProfile(
  input: UpdateVendorProfileInput,
): Promise<UpdateVendorProfileResult> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const patch: Record<string, unknown> = {};

  if (input.displayName !== undefined) {
    const v = input.displayName.trim();
    if (!v) return { ok: false, error: "Display name is required." };
    if (v.length > 80) return { ok: false, error: "Display name too long (80 max)." };
    patch.display_name = v;
  }

  if (input.legalBusinessName !== undefined) {
    const v = input.legalBusinessName?.trim() ?? null;
    if (v && v.length > 120) return { ok: false, error: "Legal name too long (120 max)." };
    patch.legal_business_name = v || null;
  }

  if (input.city !== undefined) {
    const v = input.city?.trim() ?? null;
    if (v && v.length > 80) return { ok: false, error: "City too long (80 max)." };
    patch.city = v || null;
  }

  if (input.websiteUrl !== undefined) {
    const v = input.websiteUrl?.trim() ?? null;
    if (v && !/^https?:\/\//i.test(v)) {
      return { ok: false, error: "Website must start with http:// or https://." };
    }
    if (v && v.length > 240) return { ok: false, error: "Website URL too long (240 max)." };
    patch.website_url = v || null;
  }

  if (input.foundingStory !== undefined) {
    const v = input.foundingStory?.trim() ?? null;
    if (v && v.length > 2000) return { ok: false, error: "Bio too long (2000 max)." };
    patch.founding_story = v || null;
  }

  if (input.yearsInBusiness !== undefined) {
    const v = input.yearsInBusiness;
    if (v !== null && (!Number.isInteger(v) || v < 0 || v > 100)) {
      return { ok: false, error: "Years in business must be 0–100." };
    }
    patch.years_in_business = v;
  }

  if (input.contactEmail !== undefined) {
    const v = input.contactEmail?.trim() ?? null;
    if (v && !EMAIL_RE.test(v)) return { ok: false, error: "Email format looks off." };
    patch.contact_email = v || null;
  }

  if (input.contactPhone !== undefined) {
    const v = input.contactPhone?.trim() ?? null;
    if (v && v.length > 32) return { ok: false, error: "Phone too long (32 max)." };
    patch.contact_phone = v || null;
  }

  if (input.serviceZips !== undefined) {
    const zips = (input.serviceZips ?? []).map((z) => z.trim()).filter(Boolean);
    if (zips.length > 25) return { ok: false, error: "Up to 25 service ZIPs." };
    for (const z of zips) {
      if (!ZIP_RE.test(z)) return { ok: false, error: `"${z}" isn't a valid ZIP.` };
    }
    patch.service_zips = zips;
  }

  if (input.startingPriceCents !== undefined) {
    const v = input.startingPriceCents;
    if (v !== null && (!Number.isInteger(v) || v < 0 || v > 100_000_000)) {
      return { ok: false, error: "Starting price out of range." };
    }
    patch.starting_price_cents = v;
  }

  if (input.referralRatePct !== undefined) {
    const v = input.referralRatePct;
    if (v !== null && (v < 0 || v > 25)) {
      return { ok: false, error: "Referral rate must be 0–25." };
    }
    patch.referral_rate_pct = v;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No fields to update." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .update(patch)
    .eq("tenant_id", vendor.tenantId)
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Update failed." };
  }
  revalidatePath("/vndr/profile");
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
