import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { getUnreadCountForVendor } from "@/lib/messaging/inquiry-thread";
import { BottomNavInner } from "./BottomNavInner";

/**
 * Server wrapper that loads the unread-inquiry-message count for the
 * current vendor and passes it to the client-side BottomNavInner. Sits
 * in the vndr layout so the Inquiries badge stays in sync across every
 * /vndr/* route.
 *
 * Returns 0 when the user isn't signed in / isn't a vendor — caller
 * (the layout) is upstream of role gating, so this fails gracefully
 * rather than throwing.
 */
export async function BottomNav() {
  const vendor = await getCurrentVendor();
  const unreadCount = vendor ? await getUnreadCountForVendor(vendor.tenantId) : 0;
  return <BottomNavInner unreadCount={unreadCount} />;
}
