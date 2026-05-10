"use client";

import { useEffect, useState } from "react";
import styles from "../orgnz.module.css";

type Props = {
  /** ISO datetime — combine event.start_date and event.start_time on the server */
  targetIso: string;
};

type Parts = { d: number; h: number; m: number };

function compute(targetIso: string): Parts | null {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const delta = target - now;
  if (delta <= 0) return null;
  const d = Math.floor(delta / 86_400_000);
  const h = Math.floor((delta % 86_400_000) / 3_600_000);
  const m = Math.floor((delta % 3_600_000) / 60_000);
  return { d, h, m };
}

export function Countdown({ targetIso }: Props) {
  const [parts, setParts] = useState<Parts | null>(() => compute(targetIso));

  useEffect(() => {
    const tick = () => setParts(compute(targetIso));
    tick();
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  if (!parts) {
    return (
      <div className={styles.cdCol}>
        <div className={styles.cdn}>—</div>
        <div className={styles.cdl}>past</div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.cdCol}>
        <div className={styles.cdn}>{parts.d}</div>
        <div className={styles.cdl}>days</div>
      </div>
      <div className={styles.cdsep}>:</div>
      <div className={styles.cdCol}>
        <div className={styles.cdn}>{String(parts.h).padStart(2, "0")}</div>
        <div className={styles.cdl}>hrs</div>
      </div>
      <div className={styles.cdsep}>:</div>
      <div className={styles.cdCol}>
        <div className={styles.cdn}>{String(parts.m).padStart(2, "0")}</div>
        <div className={styles.cdl}>min</div>
      </div>
    </>
  );
}
