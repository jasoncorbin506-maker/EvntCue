import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { Chrome, NotifButton, ChromeSignOut } from "../_components/Chrome";
import s from "../vndr.module.css";

/**
 * Vndr Money tab — V-2a stub. Consolidates Earnings / Analytics / Billing
 * from the desktop sidebar's "Money" group. V-2c ports the Venu money tab
 * patterns (hero earnings + period segments + breakdown) once payout
 * primitives are in place.
 */
export default async function VndrMoney() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vndr-onboarding/1");

  return (
    <>
      <Chrome
        vendorName={vendor.displayName}
        meta="Money"
        right={
          <>
            <NotifButton />
            <ChromeSignOut />
          </>
        }
      />
      <div className={s.placeholder}>
        <div className={s.placeholderTitle}>Coming soon</div>
        <div className={s.placeholderBody}>
          Once your first bookings land, this is where you&apos;ll track
          earnings, payouts, and platform fees. Hold tight — the money tab
          unlocks alongside the first wave of completed events.
        </div>
      </div>
    </>
  );
}
