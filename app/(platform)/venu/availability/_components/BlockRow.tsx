"use client";

import { useState, useTransition } from "react";
import { deleteAvailabilityBlock } from "../../_actions/delete-availability-block";
import s from "./BlockRow.module.css";

/**
 * Single-row affordance in the Manual blocks list. Shows the date + time
 * window + space (when not whole-venue) + reason; lets the venue operator
 * remove the block inline.
 *
 * No edit affordance for Session A — venue operator deletes + adds. Edit
 * lands when the calendar-grid UI ships (post-Venu-lock revisit, pre-launch
 * if cycles allow).
 */

type Props = {
  id: string;
  blockedDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  /** null = whole-venue block; non-null = "Main Ballroom" etc. */
  spaceName: string | null;
};

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(timeStr: string | null): string {
  if (!timeStr) return "All day";
  const [hRaw, m] = timeStr.split(":");
  const h = Number(hRaw);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

export function BlockRow({
  id,
  blockedDate,
  startTime,
  endTime,
  reason,
  spaceName,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (removed) return null;

  const window = startTime
    ? `${fmtTime(startTime)} – ${fmtTime(endTime)}`
    : "All day";

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteAvailabilityBlock(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRemoved(true);
    });
  }

  return (
    <div className={s.row}>
      <div className={s.body}>
        <div className={s.date}>{fmtDate(blockedDate)}</div>
        <div className={s.meta}>
          <span className={s.window}>{window}</span>
          {spaceName && <span className={s.dot}>·</span>}
          {spaceName && <span className={s.space}>{spaceName}</span>}
          {reason && <span className={s.dot}>·</span>}
          {reason && <span className={s.reason}>{reason}</span>}
        </div>
        {error && <div className={s.error}>{error}</div>}
      </div>
      <button
        type="button"
        className={s.remove}
        onClick={handleRemove}
        disabled={pending}
        aria-label="Remove this block"
      >
        {pending ? "…" : "Remove"}
      </button>
    </div>
  );
}
