"use client";

import { useState, useTransition } from "react";
import { respondToInquiry } from "../_actions/respond-to-inquiry";
import { declineInquiry } from "../_actions/decline-inquiry";
import type { VndrInquiry, VndrInquiryStatus } from "@/lib/vndr/inquiries";
import s from "./InquiryDetailSheet.module.css";

/**
 * Bottom-sheet detail view for a single inquiry. Opened from an InquiryRow
 * tap in InquiriesList. Surfaces:
 *
 *   - Event date + guest count + message from buyer (organizer or venue)
 *   - Existing status + responded info (if already quoted)
 *   - First-response action (price input + submit) when status is
 *     'inquiry' or 'reviewing' — sets quoted_price + responded_at + status
 *     via respondToInquiry server action.
 *   - Read-only view when status is past 'quoted'.
 *
 * Same scrim + drawer pattern as AvailabilityBlockSheet. Lock 22 holds —
 * any submit error inlines under the input; never blocks the close action.
 */

type Props = {
  inquiry: VndrInquiry;
  onClose: () => void;
};

const RESPONDABLE: VndrInquiryStatus[] = ["inquiry", "reviewing"];
const DECLINABLE: VndrInquiryStatus[] = ["inquiry", "reviewing", "quoted"];

const STATUS_LABEL: Record<VndrInquiryStatus, string> = {
  inquiry: "Open — needs quote",
  reviewing: "Reviewing",
  quoted: "Quoted",
  penciled: "Penciled in",
  inked: "Signed",
  booked: "Booked",
  closed: "Closed",
};

function formatEventDate(date: string): string {
  if (!date) return "Date TBD";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPriceInput(cents: number | null): string {
  if (cents === null || cents === 0) return "";
  return (cents / 100).toFixed(0);
}

function formatPriceDisplay(cents: number | null): string {
  if (cents === null) return "—";
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

export function InquiryDetailSheet({ inquiry, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [priceStr, setPriceStr] = useState(
    formatPriceInput(inquiry.proposedPriceCents),
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);

  const canRespond = RESPONDABLE.includes(inquiry.status);
  const canDecline = DECLINABLE.includes(inquiry.status);

  function handleSubmit() {
    setError(null);
    const dollars = Number(priceStr);
    if (!priceStr || !Number.isFinite(dollars) || dollars < 0) {
      setError("Enter a price in whole dollars.");
      return;
    }
    const cents = Math.round(dollars * 100);
    startTransition(async () => {
      const res = await respondToInquiry({
        inquiryId: inquiry.id,
        quotedPriceCents: cents,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  function handleDecline() {
    setError(null);
    startTransition(async () => {
      const res = await declineInquiry(inquiry.id);
      if (!res.ok) {
        setError(res.error);
        setConfirmDecline(false);
        return;
      }
      onClose();
    });
  }

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label="Inquiry detail">
        <div className={s.header}>
          <div>
            <div className={s.title}>{formatEventDate(inquiry.eventDate)}</div>
            <div className={s.subtitle}>
              {inquiry.guestCount > 0
                ? `${inquiry.guestCount} guests`
                : "Guest count TBD"}
              {" · "}
              {STATUS_LABEL[inquiry.status]}
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

        {inquiry.message && (
          <>
            <div className={s.sectionLbl}>
              Message from {inquiry.buyerRole === "venue" ? "venue" : "organizer"}
            </div>
            <div className={s.message}>{inquiry.message}</div>
          </>
        )}

        {!canRespond && inquiry.proposedPriceCents !== null && (
          <>
            <div className={s.sectionLbl}>Your quote</div>
            <div className={s.priceReadonly}>
              {formatPriceDisplay(inquiry.proposedPriceCents)}
            </div>
          </>
        )}

        {canRespond && (
          <>
            <div className={s.sectionLbl}>Your quote</div>
            <div className={s.priceRow}>
              <span className={s.dollarPrefix}>$</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="0"
                className={s.priceInput}
                aria-label="Quote amount in dollars"
              />
            </div>
            <div className={s.hint}>
              Sent now — the {inquiry.buyerRole === "venue" ? "venue" : "organizer"} sees your price and can accept.
            </div>
          </>
        )}

        {error && <div className={s.errMsg}>{error}</div>}

        {confirmDecline ? (
          <div className={s.declineConfirm}>
            <div className={s.declineConfirmTxt}>
              Decline this inquiry? It will move to <b>Lost</b> and you won't
              be able to respond to it later.
            </div>
            <div className={s.footer}>
              <button
                type="button"
                className={s.btn}
                onClick={() => setConfirmDecline(false)}
                disabled={pending}
              >
                Keep
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.btnDanger}`}
                onClick={handleDecline}
                disabled={pending}
              >
                {pending ? "Declining…" : "Yes, decline"}
              </button>
            </div>
          </div>
        ) : (
          <div className={s.footer}>
            <button type="button" className={s.btn} onClick={onClose}>
              {canRespond || canDecline ? "Cancel" : "Close"}
            </button>
            {canDecline && (
              <button
                type="button"
                className={`${s.btn} ${s.btnGhost}`}
                onClick={() => setConfirmDecline(true)}
                disabled={pending}
              >
                Decline
              </button>
            )}
            {canRespond && (
              <button
                type="button"
                className={`${s.btn} ${s.btnPrimary}`}
                onClick={handleSubmit}
                disabled={pending}
              >
                {pending ? "Sending…" : "Send quote"}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
