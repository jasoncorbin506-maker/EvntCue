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
export function Hero({ eventName, longDate, daysOut, guestCount }: Props) {
  const couple = eventName.match(/^(.+?)\s+&\s+(.+?)(?:\s*['’]s\s+\w+)?$/);

  return (
    <section className={styles.hero}>
      <div className={styles.heroEyebrow}>Your celebration</div>
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
              {daysOut === 0 ? "today" : `${daysOut} days out`}
            </span>
          </>
        )}
        {guestCount != null && (
          <>
            <span className={styles.heroMetaSep} />
            <span>{guestCount} guests</span>
          </>
        )}
      </div>
    </section>
  );
}
