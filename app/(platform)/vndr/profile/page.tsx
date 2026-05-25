import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import {
  getVendorProfile,
  getVendorPhotos,
  getVendorCertifications,
} from "@/lib/vndr/profile";
import { Chrome, NotifButton, ChromeSignOut } from "../_components/Chrome";
import { ProfileForm } from "../_components/ProfileForm";

/**
 * Vndr Profile tab — V-2b Session B (2026-05-25). Section-level edit-in-
 * place for the vendor's `vendors` row: basics, contact, location, pricing.
 * Plus a portfolio photo grid (migration 056 — vendor_photos table +
 * vendor-photos storage bucket), certifications read-only list, and a
 * link out to the Home tab for package editing.
 *
 * Reads in parallel via Promise.all to keep TTFB tight. Empty state on a
 * brand-new vendor is honest — most fields show "—" until edited.
 */
export default async function VndrProfile() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vndr-onboarding/1");

  const [profile, photos, certs] = await Promise.all([
    getVendorProfile(vendor.tenantId),
    getVendorPhotos(vendor.tenantId),
    getVendorCertifications(vendor.tenantId),
  ]);

  if (!profile) redirect("/vndr-onboarding/1");

  return (
    <>
      <Chrome
        vendorName={vendor.displayName}
        meta="Profile"
        right={
          <>
            <NotifButton />
            <ChromeSignOut />
          </>
        }
      />
      <ProfileForm
        profile={profile}
        photos={photos}
        certifications={certs}
      />
    </>
  );
}
