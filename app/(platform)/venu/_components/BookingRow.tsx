import Link from "next/link";
import {
  type DemoBooking,
  formatEventDate,
  formatUSDCents,
} from "../_lib/demo-data";
import s from "../venu.module.css";

/**
 * Single booking row on the Bookings tab. Tappable — links into the event
 * detail view at /venu/bookings/[event_id] per the spine-of-the-platform
 * principle (every event_id-scoped surface lives inside that one view).
 *
 * Visual: status pill (left) + event title + meta line (time · space · headcount)
 * + net revenue on the right. Mockup reference: shares the visual language
 * of the event-action row from Screen 2.
 */
export function BookingRow({ booking }: { booking: DemoBooking }) {
  const statusCls =
    booking.status === "confirmed" ? s.bookingPillConfirmed :
    booking.status === "tentative" ? s.bookingPillTentative :
    s.bookingPillCompleted;

  return (
    <Link href={`/venu/bookings/${booking.eventId}`} className={s.bookingRow}>
      <div className={`${s.bookingPill} ${statusCls}`}>
        {booking.status === "tentative" ? "Tentative" : booking.status === "completed" ? "Done" : "Confirmed"}
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
