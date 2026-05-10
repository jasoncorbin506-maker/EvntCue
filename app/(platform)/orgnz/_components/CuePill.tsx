"use client";

import styles from "../orgnz.module.css";
import { showToast } from "../_lib/toast";

export function CuePill() {
  return (
    <div className={styles.cuePillWrap}>
      <button
        type="button"
        className={styles.cuePill}
        onClick={() => showToast("Cue is here. <em>What do you need?</em>")}
      >
        <span className={styles.cuePillSpark} />
        <span className={styles.cuePillLabel}>Ask Cue</span>
      </button>
    </div>
  );
}
