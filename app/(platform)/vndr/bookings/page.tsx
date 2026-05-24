import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { Chrome, NotifButton } from "../_components/Chrome";
import s from "../vndr.module.css";

/**
 * Vndr Bookings tab — V-2a stub. V-2b lists confirmed/tentative/completed
 * bookings with date-change notifications surfaced per Lock 24.
 */
export default async function VndrBookings() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vndr-onboarding/1");

  return (
    <>
      <Chrome vendorName={vendor.displayName} meta="Bookings" right={<NotifButton />} />
      <div className={s.placeholder}>
        <div className={s.placeholderTitle}>Bookings</div>
        <div className={s.placeholderBody}>
          Confirmed and tentative bookings will live here. Date-change notifications
          (per Lock 24) surface as inline cards once V-2b lands.
        </div>
      </div>
    </>
  );
}
