import { notFound, redirect } from "next/navigation";
import { Chrome } from "../../_components/Chrome";
import { formatEventDate, formatUSDCents } from "../../_lib/demo-data";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import { getVenueEventDetail } from "@/lib/venu/bookings";
import { bookingStatusLabel, bookingStatusTone } from "@/lib/labels/booking-status";
import s from "../../venu.module.css";

/**
 * Venu Event Detail. Wire-DB: single-row read against bookings + events join,
 * scoped to current venue's tenant. RLS handles cross-tenant denial silently
 * (foreign event_ids return null → notFound).
 *
 * Per the spine-of-the-platform principle (Operating Ritual decision #9),
 * every event_id-scoped surface lives inside this view. Six action rows
 * (BEO, Seat chart, Timeline, Vendor roster, Money, Messages) remain
 * feature-category placeholders until each feature ships. The Money row
 * is the one wired to live data (booking net revenue).
 */

const ICON_BEO =
  "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M14 3v6h6 M9 13h6 M9 17h6";
const ICON_SEAT =
  "M4 4h16v16H4z M8 9 h0 M12 9 h0 M16 9 h0 M8 13 h0 M12 13 h0 M16 13 h0 M8 17 h0 M12 17 h0 M16 17 h0";
const ICON_TIMELINE = "M12 7v5l3 2 M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0";
const ICON_VENDORS =
  "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5 7a4 4 0 0 1 8 0 a4 4 0 0 1 -8 0 M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.7";
const ICON_MONEY = "M12 4v16 M7 8h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8";
const ICON_MESSAGES =
  "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z";

export default async function VenuEventDetail({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;
  const venue = await getCurrentVenue();
  if (!venue) redirect("/venues");

  const booking = await getVenueEventDetail(event_id, venue.tenantId, venue.displayName);
  if (!booking) notFound();

  const tone = bookingStatusTone(booking.status);
  const eventStatusCls =
    tone === "tentative" ? s.eventStatusTentative :
    tone === "completed" ? s.eventStatusCompleted :
    s.eventStatusConfirmed;

  // Six action rows = feature categories. State stays neutral until each
  // feature ships (BEO acknowledgment, seat chart builder, timeline editor,
  // vendor roster, message thread). The Money row is wired to live net-revenue.
  const actions = [
    { key: "beo",       name: "BEO acknowledgment",          sub: "Sign off on the banquet event order",   iconPath: ICON_BEO },
    { key: "seat",      name: "Seat chart",                  sub: "Builds when the floor-plan feature lands", iconPath: ICON_SEAT },
    { key: "timeline",  name: "Timeline",                    sub: "Day-of run of show — coming with Plnr cockpit", iconPath: ICON_TIMELINE },
    { key: "vendors",   name: "Vendor roster",               sub: "Confirmed vendors + COI status — coming with Vndr portal", iconPath: ICON_VENDORS },
    { key: "money",     name: "Money for this event",        sub: "Rental · fees · payout previews",         iconPath: ICON_MONEY, statusLabel: `${formatUSDCents(booking.netRevenueCents)} net`, state: "done" as const },
    { key: "messages",  name: "Messages with the Orgnz",     sub: "Threads land with the message-center build", iconPath: ICON_MESSAGES },
  ];

  return (
    <>
      <Chrome
        venueName={booking.eventName}
        roleLabel={`Booking · #${booking.eventId.slice(0, 8)}`}
        backHref="/venu/bookings"
      />

      <div className={s.eventHero}>
        <div className={s.eventStatusRow}>
          <div className={`${s.eventStatus} ${eventStatusCls}`}>
            {bookingStatusLabel(booking.status)}
          </div>
          <div className={s.eventId}>#{booking.eventId.slice(0, 8)}</div>
        </div>
        <div className={s.eventName}>{booking.eventName}</div>
        <div className={s.eventMetaGrid}>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>When</div>
            <div className={s.eventMetaVal}>
              {formatEventDate(booking.eventDate)} · {booking.startTime}
            </div>
          </div>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>Space</div>
            <div className={s.eventMetaVal}>{booking.spaceLabel}</div>
          </div>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>Guests</div>
            <div className={s.eventMetaVal}>{booking.guestCount} seated</div>
          </div>
          <div className={s.eventMetaItem}>
            {/* Lock 14b — "Net revenue" not "Take-home" per chunk-A register fix. */}
            <div className={s.eventMetaLbl}>Net revenue</div>
            <div className={s.eventMetaVal}>{formatUSDCents(booking.netRevenueCents)}</div>
          </div>
        </div>
      </div>

      <section className={s.section}>
        <div className={s.sectionH}>
          <h2 className={s.sectionT}>For this event</h2>
        </div>
        <div className={s.eventActions}>
          {actions.map((action) => (
            <button key={action.key} type="button" className={s.eventAction}>
              <div className={s.eventActionIco}>
                <svg viewBox="0 0 24 24">
                  {action.iconPath.split(" M").map((seg, i) => (
                    <path key={i} d={i === 0 ? seg : `M${seg}`} />
                  ))}
                </svg>
              </div>
              <div className={s.eventActionBody}>
                <div className={s.eventActionName}>{action.name}</div>
                <div className={s.eventActionSub}>{action.sub}</div>
              </div>
              <div className={s.eventActionMeta}>
                {action.state && action.statusLabel && (
                  <div
                    className={`${s.eventActionStatus} ${
                      action.state === "done" ? s.eventActionStatusDone : s.eventActionStatusTodo
                    }`}
                  >
                    {action.statusLabel}
                  </div>
                )}
                <div className={s.eventActionArrow}>›</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
