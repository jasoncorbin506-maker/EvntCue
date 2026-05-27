"use client";

import { useState, useTransition } from "react";

import styles from "../orgnz.module.css";

import { acceptVendorCancellation } from "../_actions/accept-vendor-cancellation";

/**
 * Confirmation modal for "Accept the cancellation" on a declined/expired
 * date-change feed card (Lock 24 Chunk D).
 *
 * The ONE modal in the orgnz-side date-change flow. Per Lock 24 entry:
 *
 *   "Cancelling a confirmed booking has real-world consequences (vendor
 *    relationship, possible refund implications, payment schedule). This
 *    is the one moment where a modal's friction is doing useful work —
 *    it stops the user from accidentally tapping cancellation while
 *    skimming."
 *
 * Per UX critique #1.4, the "Accept the cancellation" CTA on the feed
 * card itself is visually demoted to coral-outline (secondary weight)
 * so the destructive path doesn't read as co-equal with re-engage /
 * replace. Inside this modal the action gets its proper visual weight
 * (coral filled "Confirm cancellation") because the friction layer
 * already did its job.
 */

type Props = {
  notificationId: string;
  vendorDisplayName: string;
  onClose: () => void;
};

export function AcceptCancellationModal({
  notificationId,
  vendorDisplayName,
  onClose,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await acceptVendorCancellation({ notificationId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div className={styles.acScrim} onClick={onClose} role="presentation">
      <div
        className={styles.acModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accept-cancellation-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={styles.acTitle} id="accept-cancellation-title">
          Cancel booking with <em>{vendorDisplayName}</em>?
        </h3>
        <div className={styles.acBody}>
          This will cancel your booking with <b>{vendorDisplayName}</b>. Your
          payment schedule will pause; refunds (if any) follow your Vndr&apos;s
          cancellation policy.
        </div>
        <div className={styles.acFineprint}>
          This action can be reversed within 14 days by contacting support.
        </div>
        {error && <div className={styles.acError}>{error}</div>}
        <div className={styles.acActions}>
          <button
            type="button"
            className={styles.acNevermind}
            onClick={onClose}
            disabled={pending}
          >
            Never mind
          </button>
          <button
            type="button"
            className={styles.acConfirm}
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? "Cancelling…" : "Confirm cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}
