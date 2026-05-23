import { getLocale, getTranslations } from "next-intl/server";
import { EventTime } from "@/app/_components/EventTime";
import {
  zonedWallClockToUtcMillis,
  type EventTimingFields,
} from "@/lib/events/timing";
import { DateStatusBadge } from "./DateStatusBadge";
import { EventDateEditTrigger } from "./EventDateEditor";
import styles from "../orgnz.module.css";

type Props = {
  eventName: string;
  longDate: string;
  daysOut: number | null;
  guestCount: number | null;
  /** Per F5.b + F7 — wire the cascade-aware edit trigger inline next to
   *  the date display. Optional so older callers still render. */
  eventId?: string;
  timing?: EventTimingFields;
};

/**
 * Editorial-luxe hero. If the event name contains " & " (couple-style),
 * each side is rendered with the rose-tinted italic emphasis the v2 mockup
 * uses for "Sofia & Marcus". Otherwise the whole name renders as one line.
 */
export async function Hero({
  eventName,
  longDate,
  daysOut,
  guestCount,
  eventId,
  timing,
}: Props) {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const couple = eventName.match(/^(.+?)\s+&\s+(.+?)(?:\s*['’]s\s+\w+)?$/);

  // Per F4.b — compose start_at server-side (using the JS mirror of
  // events_start_at()) so EventTime renders viewer-local with the
  // event-local tooltip. Date-only path (start_time === null) skips
  // EventTime since there's no viewer-vs-event TZ ambiguity for a
  // date-only render.
  const startAt: Date | null =
    timing && timing.start_time
      ? new Date(
          zonedWallClockToUtcMillis(
            timing.start_date,
            timing.start_time,
            timing.timezone,
          ),
        )
      : null;

  return (
    <section className={styles.hero}>
      <div className={styles.heroEyebrow}>{t("heroEyebrow")}</div>
      <h1 className={styles.heroCouple}>
        {couple ? (
          <>
            <em>{couple[1]}</em> &amp; <em>{couple[2]}</em>
          </>
        ) : (
          <em>{eventName}</em>
        )}
      </h1>
      <div className={styles.heroMeta}>
        <span>{longDate}</span>
        {startAt && timing && (
          <>
            <span>·</span>
            <EventTime at={startAt} eventTimezone={timing.timezone} format="timeOnly" />
          </>
        )}
        {timing && (
          <DateStatusBadge
            status={timing.date_status}
            locale={locale === "es" ? "es" : "en"}
          />
        )}
        {eventId && timing && (
          <EventDateEditTrigger eventId={eventId} current={timing} />
        )}
        {daysOut != null && (
          <>
            <span className={styles.heroMetaSep} />
            <span className={styles.heroMetaD}>
              {daysOut === 0 ? t("chromeDaysToday") : t("heroDaysOut", { n: daysOut })}
            </span>
          </>
        )}
        {guestCount != null && (
          <>
            <span className={styles.heroMetaSep} />
            <span>{t("heroGuests", { n: guestCount })}</span>
          </>
        )}
      </div>
    </section>
  );
}
