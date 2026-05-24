import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { Chrome, NotifButton } from "../_components/Chrome";
import s from "../vndr.module.css";

/**
 * Vndr Inquiries tab — V-2a stub. V-2b ports the segment control
 * (New / Quoted / Held / Closed) + inquiry rows pattern from Venu, wired
 * against the inquiries table filtered by current vendor.
 */
export default async function VndrInquiries() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vndr-onboarding/1");

  return (
    <>
      <Chrome vendorName={vendor.displayName} meta="Inquiries" right={<NotifButton hasUnread />} />
      <div className={s.placeholder}>
        <div className={s.placeholderTitle}>Inquiries</div>
        <div className={s.placeholderBody}>
          New leads, quotes, and held requests will live here. Coming in V-2b alongside the
          real inquiries pipeline.
        </div>
      </div>
    </>
  );
}
