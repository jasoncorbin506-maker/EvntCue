"use client";

import { useState, useTransition } from "react";
import { requestBookingCancellation } from "../_actions/request-booking-cancellation";
import {
  CANCELLATION_CATEGORIES,
  CATEGORY_LABELS,
  type CancellationCategory,
} from "@/lib/bookings/cancellation-requests";
import s from "./ReviewSheet.module.css";

/**
 * Vendor-side cancellation request sheet. Opens from BookingDetailSheet
 * "Request cancellation" button. Submits via requestBookingCancellation
 * server action which flips bookings.status → 'cancellation_requested'.
 *
 * Lock 22 hold: warnings inform, never block. The sheet warns about
 * status flip in copy but doesn't gate submit.
 */

type Props = {
  bookingId: string;
  bookingHeadline: string;
  onClose: () => void;
};

const MAX_REASON_TEXT = 2000;

export function CancellationRequestSheet({
  bookingId,
  bookingHeadline,
  onClose,
}: Props) {
  const [category, setCategory] = useState<CancellationCategory | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (!category) {
      setError("Pick a reason.");
      return;
    }
    if (reasonText.length > MAX_REASON_TEXT) {
      setError(`Reason too long (${MAX_REASON_TEXT} max).`);
      return;
    }
    startTransition(async () => {
      const res = await requestBookingCancellation({
        bookingId,
        reasonCategory: category,
        reasonText: reasonText.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label="Request cancellation">
        <div className={s.header}>
          <div>
            <div className={s.title}>Request cancellation</div>
            <div className={s.subtitle}>{bookingHeadline}</div>
          </div>
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={s.sectionLbl}>Reason</div>
        <div className={s.body} style={{ minHeight: "auto", padding: 0, border: "none", background: "transparent" }}>
          {CANCELLATION_CATEGORIES.map((c) => (
            <label
              key={c}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                cursor: "pointer",
                fontSize: 13,
                color: category === c ? "#fff" : "var(--txt2)",
              }}
            >
              <input
                type="radio"
                name="cancellation-category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                disabled={pending}
                style={{ accentColor: "var(--coral)" }}
              />
              {CATEGORY_LABELS[c]}
            </label>
          ))}
        </div>

        <div className={s.sectionLbl}>Notes (optional)</div>
        <textarea
          className={s.body}
          placeholder="Add context the organizer should see."
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          rows={3}
          maxLength={MAX_REASON_TEXT}
          disabled={pending}
          aria-label="Cancellation notes"
        />

        <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 8, lineHeight: 1.4 }}>
          The booking will move to <b>Cancellation requested</b> immediately. The
          organizer can approve (booking cancels) or deny (booking returns to
          confirmed). Refund handling lands in a later release.
        </div>

        {error && <div className={s.errMsg}>{error}</div>}

        <div className={s.footer}>
          <button
            type="button"
            className={s.btn}
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={handleSubmit}
            disabled={pending || !category}
          >
            {pending ? "Filing…" : "File request"}
          </button>
        </div>
      </div>
    </>
  );
}
