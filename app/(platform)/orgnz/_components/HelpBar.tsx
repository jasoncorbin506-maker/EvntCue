"use client";

import styles from "../orgnz.module.css";
import { showToast } from "../_lib/toast";

export function HelpBar() {
  return (
    <nav className={styles.helpBar} aria-label="Quick actions">
      <button
        type="button"
        className={`${styles.hbBtn} ${styles.hbCue}`}
        onClick={() => showToast("Cue is here. <em>What do you need?</em>")}
      >
        <span className={styles.hbCueSpark} />
        Ask Cue
      </button>
      <button
        type="button"
        className={`${styles.hbBtn} ${styles.hbBump}`}
        onClick={() =>
          showToast("12-Min Bump opens here in <em>3.2.C</em>.")
        }
      >
        <span className={styles.hbBumpDot} />
        12-Min Bump
      </button>
    </nav>
  );
}
