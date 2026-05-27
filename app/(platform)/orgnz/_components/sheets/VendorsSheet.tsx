"use client";

import styles from "../../orgnz.module.css";
import { Sheet } from "../Sheet";
import { showToast } from "../../_lib/toast";

type Props = {
  open: boolean;
  onClose: () => void;
  hasVenu: boolean;
};

export function VendorsSheet({ open, onClose, hasVenu }: Props) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="Vndrs"
      eyebrowAccent="coral"
      title={
        <>
          Your <em>team</em>
        </>
      }
    >
      <div className={styles.sheetEmpty}>
        <div className={styles.sheetEmptyT}>
          <em>No Vndrs booked yet.</em>
        </div>
        <div className={styles.sheetEmptyB}>
          {hasVenu
            ? "Your Venu's locked — start matching with photographers, Catrs, florals, and music."
            : "Lock 5a: Vndrs firm up once your Venu confirms the date. Browse for inspiration in the meantime."}
        </div>
      </div>

      <button
        type="button"
        className={styles.browseCta}
        onClick={() => showToast("DFW Vndr Marketplace opens in <em>Phase 5</em>.")}
      >
        <div className={styles.browseCtaL}>
          <div className={styles.browseCtaEye}>Find your team</div>
          <div className={styles.browseCtaT}>Browse the DFW Vndr Marketplace →</div>
        </div>
        <span className={styles.browseCtaArrow}>→</span>
      </button>
    </Sheet>
  );
}
