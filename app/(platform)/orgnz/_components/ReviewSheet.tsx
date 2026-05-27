"use client";

import { useState, useTransition } from "react";
import { submitReview } from "../_actions/submit-review";
import type { PendingReviewPrompt } from "@/lib/reviews/event-reviews-shared";
import s from "./OrgnzInquiries.module.css";

/**
 * Organizer-side review sheet. 5-star + optional text. Submits via
 * orgnz submitReview server action (mig 062). Reuses
 * OrgnzInquiries.module.css drawer shell to stay visually consistent
 * with the inquiry detail sheet (same dark drawer + scrim + footer
 * vocabulary).
 */

type Props = {
  prompt: PendingReviewPrompt;
  onClose: () => void;
};

const MAX_BODY = 4000;

function formatEventDate(date: string): string {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ReviewSheet({ prompt, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (rating < 1 || rating > 5) {
      setError("Pick a rating.");
      return;
    }
    if (body.length > MAX_BODY) {
      setError(`Review too long (${MAX_BODY} max).`);
      return;
    }
    startTransition(async () => {
      const res = await submitReview({
        eventId: prompt.eventId,
        revieweeTenantId: prompt.counterpartyTenantId,
        rating,
        body: body.trim() || undefined,
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
      <div className={s.drawer} role="dialog" aria-label="Submit review">
        <div className={s.sheetHeader}>
          <div>
            <div className={s.sheetTitle}>
              Review {prompt.counterpartyDisplayName ?? "vendor"}
            </div>
            <div className={s.sheetSubtitle}>
              {prompt.eventName} · {formatEventDate(prompt.eventDate)}
            </div>
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

        <div className={s.sectionLbl}>Rating</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
              disabled={pending}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 32,
                lineHeight: 1,
                cursor: pending ? "not-allowed" : "pointer",
                color: rating >= n ? "var(--coral)" : "var(--txt3)",
                padding: "4px 6px",
              }}
            >
              ★
            </button>
          ))}
        </div>

        <div className={s.sectionLbl}>Notes (optional)</div>
        <textarea
          className={s.composerInput}
          placeholder="What stood out? Anything the vendor should know for next time?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={MAX_BODY}
          disabled={pending}
          aria-label="Review notes"
        />

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
            className={s.btn}
            onClick={handleSubmit}
            disabled={pending || rating === 0}
            style={{
              background: "var(--coral)",
              color: "#fff",
              borderColor: "var(--coral)",
              opacity: pending || rating === 0 ? 0.5 : 1,
            }}
          >
            {pending ? "Submitting…" : "Submit review"}
          </button>
        </div>
      </div>
    </>
  );
}
