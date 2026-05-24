"use client";

import { useEffect, useState } from "react";
import s from "../vndr.module.css";

/**
 * SLA countdown card surfaced at the top of the Vndr Home dashboard when
 * there's an inquiry approaching its response deadline. Source mockup:
 * P1_Dashboard.html lines ~182–188 (.rw-card).
 *
 * Client component because we tick a countdown every second. The deadline
 * is passed in as an absolute ms timestamp so the server can compute it
 * from the inquiry's submitted_at + response SLA without hydration
 * mismatch on the first paint.
 *
 * V-2a hardcodes the alert content from the parent page; V-2b pulls the
 * urgent-inquiry row and SLA window from inquiries + organizations.
 */
type Props = {
  eventName: string;
  respondBy: string;
  deadlineMs: number;
};

export function ResponseWindowAlert({ eventName, respondBy, deadlineMs }: Props) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, deadlineMs - Date.now()));

  useEffect(() => {
    const tick = () => setRemainingMs(Math.max(0, deadlineMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <div className={s.rwCard} role="alert">
      <div className={s.rwHeader}>
        <div className={s.rwIco}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div className={s.rwTitle}>Response window</div>
      </div>
      <div className={s.rwTxt}>
        <b>{eventName}</b> — respond by {respondBy} or the inquiry releases to the next vendor.
      </div>
      <div className={s.rwTimer} aria-live="polite">{formatted}</div>
      <div className={s.rwLbl}>Time remaining</div>
    </div>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
