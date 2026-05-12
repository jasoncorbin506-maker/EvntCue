import { getTranslations } from "next-intl/server";
import styles from "../orgnz.module.css";

type Props = {
  eventName: string;
  longDate: string;
  daysOut: number | null;
  guestCount: number | null;
};

/**
 * Editorial-luxe hero. If the event name contains " & " (couple-style),
 * each side is rendered with the rose-tinted italic emphasis the v2 mockup
 * uses for "Sofia & Marcus". Otherwise the whole name renders as one line.
 */
export async function Hero({ eventName, longDate, daysOut, guestCount }: Props) {
  const t = await getTranslations("dashboard");
  const couple = eventName.match(/^(.+?)\s+&\s+(.+?)(?:\s*['’]s\s+\w+)?$/);

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
