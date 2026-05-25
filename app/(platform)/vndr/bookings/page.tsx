import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { getVndrBookings } from "@/lib/vndr/bookings";
import { Chrome, NotifButton, ChromeSignOut } from "../_components/Chrome";
import { BookingsList } from "../_components/BookingsList";

/**
 * Vndr Bookings tab — V-2b Session B (2026-05-25). Lists all bookings
 * for the current vendor with filter chips (Upcoming / Past / Cancelled).
 * Read-only view; cancellation + completion flows are V-2c (require
 * disputes + refund handling per Lock 24).
 *
 * Reads via lib/vndr/bookings.ts which embeds the parent event for
 * name/date/time/guest_count display. RLS scopes results to the vendor's
 * own bookings.
 */
export default async function VndrBookings() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vndr-onboarding/1");

  const bookings = await getVndrBookings(vendor.tenantId);

  return (
    <>
      <Chrome
        vendorName={vendor.displayName}
        meta="Bookings"
        right={
          <>
            <NotifButton />
            <ChromeSignOut />
          </>
        }
      />
      <BookingsList bookings={bookings} />
    </>
  );
}
