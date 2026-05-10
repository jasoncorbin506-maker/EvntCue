"use client";

import Link from "next/link";
import styles from "../orgnz.module.css";
import { showToast } from "../_lib/toast";

type Props = {
  eventName: string | null;
  startDateShort: string | null;
  daysOut: number | null;
};

export function Chrome({ eventName, startDateShort, daysOut }: Props) {
  return (
    <header className={styles.chrome}>
      <Link href="/orgnz" className={styles.wm}>
        <em>Evnt</em>
        <span>Cue</span>
      </Link>
      <div className={styles.eventChip}>
        {eventName ? (
          <span className={styles.eventChipName}>{eventName}</span>
        ) : (
          <span>Your celebration</span>
        )}
        {startDateShort && daysOut != null && (
          <span className={styles.eventChipD}>
            {startDateShort} · {daysOut === 0 ? "today" : `${daysOut} days`}
          </span>
        )}
      </div>
      <button
        type="button"
        className={styles.menuBtn}
        aria-label="Menu"
        onClick={() => showToast("Menu opens here — settings, sign out, switch event.")}
      >
        <svg viewBox="0 0 16 16">
          <circle cx="3" cy="8" r="1" />
          <circle cx="8" cy="8" r="1" />
          <circle cx="13" cy="8" r="1" />
        </svg>
      </button>
    </header>
  );
}
