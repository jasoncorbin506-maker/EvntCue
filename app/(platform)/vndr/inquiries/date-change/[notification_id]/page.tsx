import { notFound, redirect } from "next/navigation";

import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { getDateChangeNotificationById } from "@/lib/vndr/event-notifications";

import { Chrome, ChromeSignOut } from "../../../_components/Chrome";
import { DateChangeDetail } from "../../../_components/DateChangeDetail";

/**
 * Vendor-side date-change notification detail page — Lock 24 Chunk C.
 *
 * Full-page surface (not modal) per Lock 22 + mobile ergonomics. The
 * decision deserves the space; modals on mobile have ergonomic issues
 * and Lock 22 specifically deprecated them in favor of forgiving
 * full-page surfaces.
 *
 * Accessed via:
 *   - Tap "Review change" on the date-change card in the Inquiries list
 *   - Direct link in the day-7 reminder email (Chunk E)
 *
 * Server fetch is RLS-bound — a vendor querying someone else's
 * notification id gets null → 404.
 */

type Params = { notification_id: string };

export default async function DateChangeNotificationPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { notification_id } = await params;

  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vndr-onboarding/1");

  const notification = await getDateChangeNotificationById(notification_id);
  if (!notification) notFound();

  return (
    <>
      <Chrome
        vendorName={vendor.displayName}
        meta="Date change"
        right={<ChromeSignOut />}
      />
      <DateChangeDetail notification={notification} />
    </>
  );
}
