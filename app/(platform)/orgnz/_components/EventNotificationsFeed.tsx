"use client";

import { useMemo, useState } from "react";

import styles from "../orgnz.module.css";

import type { OrgnzEventNotification } from "@/lib/orgnz/event-notifications";
import { EventNotificationCard } from "./EventNotificationCard";

/**
 * Orgnz feed strip below the Hero for Vndr date-change responses
 * (Lock 24 Chunk D).
 *
 * Per Lock 24 UX walkthrough — orgnz-side option α (feed strip below Hero,
 * not topbar drawer):
 *
 *   "Notifications about a vendor declining a date change are
 *    high-context — the orgnz user is already on the event detail,
 *    mentally in event-planning mode. Surfacing the feedback there
 *    reduces context switching."
 *
 * UX critique pass refinements folded in here:
 *   - #2.1 Multi-vendor summary card: when 2+ vendors declined the
 *     same date change, summary card appears above individual cards.
 *   - #4.2 (a) Collapsibility: when ALL cards are accepted, the strip
 *     collapses to a single thin summary line with click-to-expand.
 *   - #4.2 (b) Visual hierarchy: section background uses a slightly
 *     darker token (--ink2) to subordinate visually to the Hero
 *     (applied via styles.enFeed in orgnz.module.css).
 *   - #5.2 V1 sort: severity first (declined + expired before
 *     accepted), chronological within group (applied by
 *     getOrgnzEventNotifications before we receive the data).
 */

type Props = {
  notifications: OrgnzEventNotification[];
};

export function EventNotificationsFeed({ notifications }: Props) {
  const [collapseExpanded, setCollapseExpanded] = useState(false);

  // Multi-vendor summary trigger: 2+ declined responses → show summary
  // above the per-vendor cards. The Lock 24 entry's framing is "before
  // resolving each individually" — surface the group problem first.
  const declinedCount = useMemo(
    () => notifications.filter((n) => n.vendorResponse === "declined").length,
    [notifications],
  );
  const showMultiVendorSummary = declinedCount >= 2;

  // Auto-collapse: when ALL notifications are accepted (no declined +
  // no expired), collapse the strip to a single summary line. Click to
  // expand restores the full card list. Per UX critique #4.2 (a).
  const allResolved = useMemo(
    () =>
      notifications.length > 0 &&
      notifications.every((n) => n.vendorResponse === "accepted"),
    [notifications],
  );

  if (notifications.length === 0) return null;

  if (allResolved && !collapseExpanded) {
    return (
      <section className={styles.enFeedCollapsed}>
        <button
          type="button"
          className={styles.enFeedCollapsedButton}
          onClick={() => setCollapseExpanded(true)}
        >
          <span>
            {notifications.length} Vndr update
            {notifications.length === 1 ? "" : "s"} — all resolved
          </span>
          <span className={styles.enFeedCollapsedExpand}>↓ Expand</span>
        </button>
      </section>
    );
  }

  return (
    <section className={styles.enFeed}>
      <div className={styles.enFeedHead}>
        <span className={styles.enFeedHeadL}>Vndr updates</span>
        <span className={styles.enFeedHeadR}>
          {notifications.length} {notifications.length === 1 ? "card" : "cards"}
        </span>
      </div>
      {showMultiVendorSummary && (
        <article className={`${styles.enCard} ${styles.enCardSummary}`}>
          <div className={styles.enCardBorder} aria-hidden="true" />
          <div className={styles.enCardBody}>
            <div className={styles.enCardTitle}>
              <b>{declinedCount}</b> of <b>{notifications.length}</b> Vndrs
              declined this date change.
            </div>
            <div className={styles.enCardSub}>
              You may want to review all responses or reconsider the date
              before resolving each individually.
            </div>
          </div>
        </article>
      )}
      <div className={styles.enFeedList}>
        {notifications.map((n) => (
          <EventNotificationCard key={n.id} notification={n} />
        ))}
      </div>
    </section>
  );
}
