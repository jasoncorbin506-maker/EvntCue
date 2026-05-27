"use client";

import { useState } from "react";

import styles from "../orgnz.module.css";
import { showToast } from "../_lib/toast";

import type { OrgnzEventNotification } from "@/lib/orgnz/event-notifications";

import { AcceptCancellationModal } from "./AcceptCancellationModal";

/**
 * Single feed card for a Vndr's date-change response (Lock 24 Chunk D).
 *
 * Three variants per vendor_response:
 *   - "accepted" — mint green left border, single "View booking" CTA,
 *     dismissable (V1: UI-only via useState; Chunk E adds persisted
 *     dismissal + auto-collapse after 7d resolved per UX critique #5.1).
 *   - "declined" — coral left border, three CTAs (re-engage, find
 *     replacement, accept cancellation). UX critique #1.4: the destructive
 *     "Accept the cancellation" CTA is coral-OUTLINE (secondary visual
 *     weight) to signal reversibility cost vs. the other two.
 *   - "expired" — gray left border, same three CTAs as declined.
 *
 * Re-engage + Find replacement are Phase-5 stubs in V1 (Vndr messaging on
 * orgnz portal + vendor search don't exist yet; same pattern as the
 * Phase-5 Marketplace toasts on the Vndr/Plnr/Venu sheets). Accept
 * cancellation opens the confirmation modal which calls the server
 * action.
 */

type Props = {
  notification: OrgnzEventNotification;
};

function formatDate(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function EventNotificationCard({ notification }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (dismissed) return null;

  const newDateShort = formatDate(notification.payload.newStartDate);
  const oldDateShort = formatDate(notification.payload.oldStartDate);
  const vndr = notification.vendorDisplayName;

  // --- Accepted variant -----------------------------------------------------
  if (notification.vendorResponse === "accepted") {
    return (
      <article className={`${styles.enCard} ${styles.enCardAccepted}`}>
        <div className={styles.enCardBorder} aria-hidden="true" />
        <div className={styles.enCardBody}>
          <button
            type="button"
            className={styles.enCardDismiss}
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
          >
            ×
          </button>
          <div className={styles.enCardTitle}>
            <b>{vndr}</b> accepted the date change.
          </div>
          <div className={styles.enCardSub}>
            Your booking is confirmed for {newDateShort}.
          </div>
          <div className={styles.enCardActions}>
            <button
              type="button"
              className={styles.enCardCtaPrimary}
              onClick={() =>
                showToast(
                  "Booking detail surface lands in <em>Phase 5</em>.",
                )
              }
            >
              View booking
            </button>
          </div>
        </div>
      </article>
    );
  }

  // --- Declined / Expired share the same three-CTA layout -------------------
  const isExpired = notification.vendorResponse === "expired";
  const borderClass = isExpired ? styles.enCardExpired : styles.enCardDeclined;
  const title = isExpired ? (
    <>
      <b>{vndr}</b> didn&apos;t respond to the date change.
    </>
  ) : (
    <>
      <b>{vndr}</b> declined the date change.
    </>
  );
  const subtitle = isExpired
    ? `Their calendar lock on ${oldDateShort} has released. Choose how to proceed.`
    : `${vndr} can't accommodate the new date. Your booking record remains, but you'll need to either re-engage them for a different solution or find a replacement.`;

  return (
    <>
      <article className={`${styles.enCard} ${borderClass}`}>
        <div className={styles.enCardBorder} aria-hidden="true" />
        <div className={styles.enCardBody}>
          <div className={styles.enCardTitle}>{title}</div>
          <div className={styles.enCardSub}>{subtitle}</div>
          <div className={styles.enCardActions}>
            <button
              type="button"
              className={styles.enCardCtaPrimary}
              onClick={() =>
                showToast(
                  `Messaging <em>${vndr}</em> lands when the Orgnz↔Vndr thread ships.`,
                )
              }
            >
              Re-engage {vndr}
            </button>
            <button
              type="button"
              className={styles.enCardCtaPrimary}
              onClick={() =>
                showToast(
                  "Vndr replacement search lands with <em>Phase 5</em>.",
                )
              }
            >
              Find a replacement
            </button>
            <button
              type="button"
              className={styles.enCardCtaSecondary}
              onClick={() => setModalOpen(true)}
            >
              Accept the cancellation
            </button>
          </div>
        </div>
      </article>
      {modalOpen && (
        <AcceptCancellationModal
          notificationId={notification.id}
          vendorDisplayName={vndr}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
