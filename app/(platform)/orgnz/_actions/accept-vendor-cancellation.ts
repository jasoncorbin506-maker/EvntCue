"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Orgnz-side action: when a Vndr declines (or expires on) a date change
 * and the orgnz user picks "Accept the cancellation" from the feed card,
 * this action cancels the booking. Per Lock 24 entry (orgnz feed card
 * "DECLINED" CTA #3 + the dedicated confirmation modal — UX critique
 * #1.4 demoted the visual weight to coral-outline since this is the
 * one truly irreversible CTA on the orgnz side).
 *
 * V1 implementation: direct flip of bookings.status to 'cancelled'
 * via admin client. Reversal (within 14 days) is via support, not a
 * system feature — matches the modal copy:
 *
 *   "This will cancel your booking with [Vndr]. Your payment schedule
 *    will pause; refunds (if any) follow your Vndr's cancellation
 *    policy. This action can be reversed within 14 days by contacting
 *    support."
 *
 * The notification row's `vendor_response` stays in its terminal state
 * (declined / expired) — the cancellation is a downstream consequence,
 * recorded separately on the booking.
 *
 * Authz: the orgnz user must own the event the booking is on. We verify
 * via user_owns_event + the booking's event_id matching the notification's
 * event_id before any write.
 */

export type AcceptVendorCancellationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function acceptVendorCancellation(args: {
  notificationId: string;
}): Promise<AcceptVendorCancellationResult> {
  const supabase = await createClient();

  // 1. RLS-bound read on the notification — confirms current user owns
  //    the event and the row exists. If RLS hides it, we return clean
  //    "not found" rather than leaking permission errors.
  const { data: notif, error: notifErr } = await supabase
    .from("event_notifications")
    .select("id, event_id, booking_id, vendor_response, vendor_tenant_id")
    .eq("id", args.notificationId)
    .maybeSingle();
  if (notifErr) {
    return { ok: false, error: notifErr.message };
  }
  if (!notif) {
    return {
      ok: false,
      error: "This notification is no longer visible — it may have been resolved already.",
    };
  }
  if (notif.vendor_response !== "declined" && notif.vendor_response !== "expired") {
    return {
      ok: false,
      error:
        "Cannot accept cancellation — the Vndr's response is " +
        String(notif.vendor_response) +
        ", not declined/expired.",
    };
  }
  if (!notif.booking_id) {
    return {
      ok: false,
      error: "This notification isn't linked to a booking — nothing to cancel.",
    };
  }

  // 2. Flip the booking to cancelled. Admin client because RLS on
  //    bookings is restrictive about who can UPDATE (typically vendor-
  //    or system-only); the prior RLS-bound read on the notification
  //    proved orgnz ownership before this admin write.
  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason:
        notif.vendor_response === "declined"
          ? "vendor_declined_date_change"
          : "vendor_did_not_respond_to_date_change",
      cancellation_type: "orgnz_accepted",
    })
    .eq("id", notif.booking_id as string);
  if (updateErr) {
    return { ok: false, error: `Could not cancel booking: ${updateErr.message}` };
  }

  // 3. Revalidate the orgnz event page so the feed re-renders without
  //    the now-resolved cancellation flow (or with new state).
  revalidatePath("/orgnz");

  return { ok: true };
}
