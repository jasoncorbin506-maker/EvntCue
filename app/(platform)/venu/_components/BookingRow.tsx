import Link from "next/link";
import { formatEventDate, formatUSDCents } from "../_lib/demo-data";
import type { VenuBooking } from "@/lib/venu/bookings";
import { bookingStatusLabel, bookingStatusTone } from "@/lib/labels/booking-status";
import s from "../venu.module.css";

/**
 * Single booking row on the Bookings tab. Tappable — links into the event
 * detail view at /venu/bookings/[event_id] per the spine-of-the-platform
 * principle (every event_id-scoped surface lives inside that one view).
 *
 * Visual: status pill (left) + event title + meta line (time · space · headcount)
 * + net revenue on the right. Status label + tone route through
 * `lib/labels/booking-status.ts` per Lock 15.
 */
export function BookingRow({ booking }: { booking: VenuBooking }) {
  const tone = bookingStatusTone(booking.status);
  const pillCls =
    tone === "confirmed" ? s.bookingPillConfirmed :
    tone === "tentative" ? s.bookingPillTentative :
    s.bookingPillCompleted;

  return (
    <Link href={`/venu/bookings/${booking.eventId}`} className={s.bookingRow}>
      <div className={`${s.bookingPill} ${pillCls}`}>
        {bookingStatusLabel(booking.status)}
      </div>
      <div className={s.bookingBody}>
        <div className={s.bookingName}>{booking.eventName}</div>
        <div className={s.bookingMeta}>
          <span>{formatEventDate(booking.eventDate)}</span>
          <span aria-hidden="true">·</span>
          <span>{booking.startTime}</span>
          <span aria-hidden="true">·</span>
          <span>{booking.spaceLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{booking.guestCount} guests</span>
        </div>
      </div>
      <div className={s.bookingRevenue}>{formatUSDCents(booking.netRevenueCents)}</div>
    </Link>
  );
}
