import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { getVndrInquiries } from "@/lib/vndr/inquiries";
import { getPendingDateChangeNotifications } from "@/lib/vndr/event-notifications";
import { Chrome, NotifButton, ChromeSignOut } from "../_components/Chrome";
import { DateChangeCard } from "../_components/DateChangeCard";
import { InquiriesList } from "../_components/InquiriesList";

/**
 * Vndr Inquiries tab — V-2b Session B (2026-05-25). Lists all inquiries
 * for the current vendor with filter chips (All / Open / Quoted / Booked /
 * Lost) per Jason's session 22 lock. Tapping a row opens the detail sheet
 * with the first-response action (price-only quote).
 *
 * Filter → status mapping per Jason 2026-05-25:
 *   Open   = inquiry + reviewing
 *   Quoted = quoted + penciled
 *   Booked = inked + booked
 *   Lost   = closed
 *
 * Reads via lib/vndr/inquiries.ts (filtered by vndr_tenant_id, ordered
 * created_at DESC). RLS scopes the result to the vendor's own inquiries.
 * Empty state is honest — brand-new vendor with no leads sees "No
 * inquiries yet."
 *
 * Lock 24 Chunk C addition: pending date-change notifications surface as
 * a distinct card variant at the top of the list (above the filter chips
 * + inquiry rows). Coral border + Cormorant title signals "this needs a
 * response in a different category than a new inquiry." Quick-Accept on
 * the card per UX critique #4.1; full decision lives on the detail page
 * at /vndr/inquiries/date-change/[notification_id].
 */
export default async function VndrInquiries() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vndr-onboarding/1");

  const [inquiries, pendingDateChanges] = await Promise.all([
    getVndrInquiries(vendor.tenantId),
    getPendingDateChangeNotifications(vendor.tenantId),
  ]);

  const hasUnresponded =
    inquiries.some((i) => i.status === "inquiry" || i.status === "reviewing") ||
    pendingDateChanges.length > 0;

  return (
    <>
      <Chrome
        vendorName={vendor.displayName}
        meta="Inquiries"
        right={
          <>
            <NotifButton hasUnread={hasUnresponded} />
            <ChromeSignOut />
          </>
        }
      />
      {pendingDateChanges.map((dc) => (
        <DateChangeCard key={dc.id} notification={dc} />
      ))}
      <InquiriesList inquiries={inquiries} />
    </>
  );
}
