"use client";

import styles from "../orgnz.module.css";
import { openCrisis } from "../_lib/sheet";
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
        onClick={() => openCrisis(true)}
      >
        <span className={styles.hbBumpDot} />
        12-Min Bump
      </button>
    </nav>
  );
}
