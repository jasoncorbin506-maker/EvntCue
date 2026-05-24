import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { Chrome, NotifButton, ChromeSignOut } from "../_components/Chrome";
import s from "../vndr.module.css";

/**
 * Vndr Profile tab — V-2a stub. Consolidates Packages / Portfolio /
 * Availability / COI & Docs from the desktop sidebar's "Profile" group.
 * V-2b ships package editing + portfolio uploads + availability toggles.
 */
export default async function VndrProfile() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vndr-onboarding/1");

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
      <div className={s.placeholder}>
        <div className={s.placeholderTitle}>Profile</div>
        <div className={s.placeholderBody}>
          Packages, portfolio, availability, and COI / docs will live here. V-2b
          wires real package editing + the portfolio uploader.
        </div>
      </div>
    </>
  );
}
