import { notFound } from "next/navigation";
import { Chrome } from "../../_components/Chrome";
import {
  formatEventDate,
  formatUSDCents,
  getDemoEventDetail,
} from "../../_lib/demo-data";
import s from "../../venu.module.css";

/**
 * Venu Event Detail — chunk B visual port complete on stub demo data.
 *
 * Per the spine-of-the-platform principle (Operating Ritual decision #9),
 * every event_id-scoped surface lives inside this view: BEO acknowledgment,
 * seat chart, timeline, vendor roster, money-for-this-event, messages with
 * the Orgnz. Six action rows, each rendered from the demo data shape.
 *
 * Source mockup: Screen 2 (lines ~565–728). Chrome uses the back-button
 * variant pointing back to /venu/bookings.
 */
export default async function VenuEventDetail({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;
  const event = getDemoEventDetail(event_id);
  if (!event) notFound();

  return (
    <>
      <Chrome
        venueName={event.name}
        roleLabel={`Booking · #${event.eventId}`}
        backHref="/venu/bookings"
      />

      <div className={s.eventHero}>
        <div className={s.eventStatusRow}>
          <div className={`${s.eventStatus} ${s.eventStatusConfirmed}`}>{event.statusLabel}</div>
          <div className={s.eventId}>#{event.eventId}</div>
        </div>
        <div className={s.eventName}>{event.name}</div>
        <div className={s.eventMetaGrid}>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>When</div>
            <div className={s.eventMetaVal}>
              {formatEventDate(event.eventDate)} · {event.startTime}
            </div>
          </div>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>Space</div>
            <div className={s.eventMetaVal}>{event.spaceLabel}</div>
          </div>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>Guests</div>
            <div className={s.eventMetaVal}>{event.guestCount} seated</div>
          </div>
          <div className={s.eventMetaItem}>
            {/* Lock 14b — "Net revenue" not "Take-home" per chunk-A register fix. */}
            <div className={s.eventMetaLbl}>Net revenue</div>
            <div className={s.eventMetaVal}>{formatUSDCents(event.netRevenueCents)}</div>
          </div>
        </div>
      </div>

      <section className={s.section}>
        <div className={s.sectionH}>
          <h2 className={s.sectionT}>For this event</h2>
        </div>
        <div className={s.eventActions}>
          {event.actions.map((action) => (
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
