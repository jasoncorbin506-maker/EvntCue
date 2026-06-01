import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { PAYOUTS_COMING_SOON } from "@/lib/labels/payments";
import { Chrome, NotifButton, ChromeSignOut } from "../_components/Chrome";
import s from "../vndr.module.css";

/**
 * Vndr Money tab — V-2a stub. Consolidates Earnings / Analytics / Billing
 * from the desktop sidebar's "Money" group. V-2c ports the Venu money tab
 * patterns (hero earnings + period segments + breakdown) once payout
 * primitives are in place.
 *
 * Pre-Stripe placeholder copy is the canonical seller "connect payouts" voice
 * from lib/labels/payments.ts — shared with the catr payments touchpoint and
 * aligned with the orgnz buyer-side copy so the portals speak with one voice.
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
        <span className={s.placeholderPill}>{PAYOUTS_COMING_SOON.pill}</span>
        <div className={s.placeholderTitle}>{PAYOUTS_COMING_SOON.title}</div>
        <div className={s.placeholderBody}>{PAYOUTS_COMING_SOON.body}</div>
        <div className={s.placeholderCta}>{PAYOUTS_COMING_SOON.cta}</div>
      </div>
    </>
  );
}
