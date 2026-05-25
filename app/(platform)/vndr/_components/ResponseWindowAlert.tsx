"use client";

import { useEffect, useState } from "react";
import type { OldestUnrespondedInquiry } from "@/lib/vndr/oldest-unresponded-inquiry";
import s from "../vndr.module.css";

/**
 * SLA countdown card surfaced at the top of the Vndr Home dashboard when
 * there's an unresponded inquiry inside (or past) its 24h response window.
 *
 * V-2b: the parent server component loads the oldest unresponded inquiry
 * via lib/vndr/oldest-unresponded-inquiry.ts; this component renders only
 * when that returns non-null (the brief specifies: don't show "0 active
 * inquiries" — suppress entirely when there's nothing urgent).
 *
 * Client component because we tick a countdown every second. Deadline is
 * passed as an absolute ms timestamp so the server computes from
 * `responded_at IS NULL` rows' created_at + SLA, avoiding hydration drift.
 */

type Props = {
  inquiry: OldestUnrespondedInquiry;
};

export function ResponseWindowAlert({ inquiry }: Props) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, inquiry.deadlineMs - Date.now()),
  );

  useEffect(() => {
    const tick = () =>
      setRemainingMs(Math.max(0, inquiry.deadlineMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [inquiry.deadlineMs]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const respondBy = formatRespondBy(inquiry.deadlineMs);
  const isOverdue = remainingMs === 0;

  return (
    <div className={s.rwCard} role="alert">
      <div className={s.rwHeader}>
        <div className={s.rwIco}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div className={s.rwTitle}>
          {isOverdue ? "Response overdue" : "Response window"}
        </div>
      </div>
      <div className={s.rwTxt}>
        {isOverdue ? (
          <>
            <b>{inquiry.eventName}</b> is past its response window. Responding
            now still puts you in front of the planner.
          </>
        ) : (
          <>
            <b>{inquiry.eventName}</b> — respond by {respondBy} or the inquiry
            releases to the next vendor.
          </>
        )}
      </div>
      <div className={s.rwTimer} aria-live="polite">{formatted}</div>
      <div className={s.rwLbl}>
        {isOverdue ? "Past deadline" : "Time remaining"}
      </div>
    </div>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatRespondBy(deadlineMs: number): string {
  const d = new Date(deadlineMs);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return `${time} tonight`;
  return d.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
