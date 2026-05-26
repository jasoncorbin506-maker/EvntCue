"use client";

import { useState, useTransition } from "react";
import { respondToCancellationRequest } from "../_actions/respond-to-cancellation-request";
import {
  CATEGORY_LABELS,
  type PendingCancellationForOrganizer,
} from "@/lib/bookings/cancellation-requests";
import s from "./OrgnzInquiries.module.css";

/**
 * Organizer-side response sheet for a pending vendor cancellation
 * request. Shows the vendor's reason category + free-text context;
 * surfaces two CTAs (Approve / Deny).
 *
 *   Approve → booking flips to 'cancelled'; cancelled_at + reason set
 *   Deny    → booking reverts to 'confirmed' from 'cancellation_requested'
 *
 * Refund handling is Phase 4 — V-2c just captures the decision.
 */

type Props = {
  request: PendingCancellationForOrganizer;
  onClose: () => void;
};

function formatRelative(iso: string): string {
  const created = new Date(iso).getTime();
  const diffH = (Date.now() - created) / (1000 * 60 * 60);
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  const diffD = diffH / 24;
  if (diffD < 7) return `${Math.round(diffD)}d ago`;
  return `${Math.round(diffD / 7)}w ago`;
}

export function IncomingCancellationRequestSheet({ request, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [confirmDecision, setConfirmDecision] = useState<
    "approve" | "deny" | null
  >(null);
  const [pending, startTransition] = useTransition();

  const categoryLabel =
    CATEGORY_LABELS[request.reasonCategory as keyof typeof CATEGORY_LABELS] ??
    request.reasonCategory;

  function handleRespond(decision: "approve" | "deny") {
    setError(null);
    startTransition(async () => {
      const res = await respondToCancellationRequest({
        requestId: request.id,
        bookingId: request.bookingId,
        decision,
      });
      if (!res.ok) {
        setError(res.error);
        setConfirmDecision(null);
        return;
      }
      onClose();
    });
  }

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label="Cancellation request">
        <div className={s.sheetHeader}>
          <div>
            <div className={s.sheetTitle}>
              {request.vendorDisplayName ?? "Vendor"} requested cancellation
            </div>
            <div className={s.sheetSubtitle}>
              {request.eventName} · filed {formatRelative(request.createdAt)}
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

        <div className={s.sectionLbl}>Reason</div>
        <div className={s.message} style={{ marginBottom: 8 }}>
          <b style={{ color: "#fff" }}>{categoryLabel}</b>
        </div>
        {request.reasonText && (
          <>
            <div className={s.sectionLbl}>Vendor&rsquo;s note</div>
            <div className={s.message}>{request.reasonText}</div>
          </>
        )}

        <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 12, lineHeight: 1.4 }}>
          Approving cancels the booking. Denying returns it to confirmed.
          Refund handling lands in a later release; this decision only flips
          status for now.
        </div>

        {error && <div className={s.errMsg}>{error}</div>}

        {confirmDecision ? (
          <>
            <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--txt2)", lineHeight: 1.5 }}>
              {confirmDecision === "approve"
                ? "Confirm: cancel this booking. The vendor will be notified."
                : "Confirm: keep the booking confirmed. The vendor's request will be marked denied."}
            </div>
            <div className={s.footer}>
              <button
                type="button"
                className={s.btn}
                onClick={() => setConfirmDecision(null)}
                disabled={pending}
              >
                Back
              </button>
              <button
                type="button"
                className={s.btn}
                onClick={() => handleRespond(confirmDecision)}
                disabled={pending}
                style={{
                  background:
                    confirmDecision === "approve" ? "#c54234" : "var(--coral)",
                  color: "#fff",
                  borderColor:
                    confirmDecision === "approve" ? "#c54234" : "var(--coral)",
                  opacity: pending ? 0.5 : 1,
                }}
              >
                {pending
                  ? "Saving…"
                  : confirmDecision === "approve"
                    ? "Yes, cancel"
                    : "Yes, keep booking"}
              </button>
            </div>
          </>
        ) : (
          <div className={s.footer}>
            <button
              type="button"
              className={s.btn}
              onClick={() => setConfirmDecision("deny")}
              disabled={pending}
            >
              Deny
            </button>
            <button
              type="button"
              className={s.btn}
              onClick={() => setConfirmDecision("approve")}
              disabled={pending}
              style={{
                background: "#c54234",
                color: "#fff",
                borderColor: "#c54234",
              }}
            >
              Approve cancellation
            </button>
          </div>
        )}
      </div>
    </>
  );
}
