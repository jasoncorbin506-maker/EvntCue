"use client";

import styles from "../orgnz.module.css";
import { openSheet } from "../_lib/sheet";
import type { OpenItemsCounts } from "@/lib/events/open-items";

type Props = {
  counts: OpenItemsCounts;
};

/**
 * Top-of-planning-timeline banner — count + tap-target into Open Items.
 *
 * Per Cowork's vendor-task-model design brief: "a top-row banner on the
 * planning timeline that surfaces a count + tap-target ('12 open items ·
 * 4 due this week')."
 *
 * Rendering rules:
 *   - counts.total === 0 → banner does NOT render (zero clutter when
 *     nothing needs attention; matches Lock 22 "warnings inform" framing —
 *     no signal becomes its own kind of signal).
 *   - Single tap-target → openSheet("openItems"). One affordance, one outcome.
 *   - Copy varies by urgency: overdue count surfaces first when > 0,
 *     then due-this-week, then bare total. Most pressing info closest to
 *     the front so a glancing user catches the right thing.
 */
export function OpenItemsBanner({ counts }: Props) {
  if (counts.total === 0) return null;

  const subtext = buildSubtext(counts);

  return (
    <button
      type="button"
      className={styles.openItemsBanner}
      onClick={() => openSheet("openItems")}
      aria-label={`Open items: ${counts.total} total${subtext ? `, ${subtext}` : ""}`}
    >
      <div className={styles.openItemsBannerBody}>
        <div className={styles.openItemsBannerCount}>
          {counts.total} open {counts.total === 1 ? "item" : "items"}
        </div>
        {subtext && (
          <div className={styles.openItemsBannerSub}>{subtext}</div>
        )}
      </div>
      <div className={styles.openItemsBannerArrow} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M5 3l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
}

function buildSubtext(counts: OpenItemsCounts): string {
  // Overdue is the strongest signal — surface first when present.
  if (counts.overdue > 0 && counts.dueThisWeek > 0) {
    return `${counts.overdue} overdue · ${counts.dueThisWeek} due this week`;
  }
  if (counts.overdue > 0) {
    return `${counts.overdue} overdue`;
  }
  if (counts.dueThisWeek > 0) {
    return `${counts.dueThisWeek} due this week`;
  }
  return "";
}
