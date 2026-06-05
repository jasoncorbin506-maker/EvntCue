"use client";

import { useState, useTransition } from "react";
import type { OrgnzInquiry } from "@/lib/orgnz/inquiries";
import { inquiryStatusLabel } from "@/lib/labels/inquiry-status";
import { isConfirmedHold } from "@/lib/labels/deposit-status";
import {
  INQUIRY_OFFER_BUYER_CAUSES,
  inquiryCauseChipLabel,
  type InquiryOfferCause,
} from "@/lib/labels/inquiry-offer";
import { acceptAndFundDeposit } from "../_actions/fund-deposit";
import { rejectCounter } from "../_actions/reject-counter";
import { OrgnzInquiryThread } from "./OrgnzInquiryThread";
import { OfferLedger } from "../../_components/OfferLedger";
import s from "./OrgnzInquiries.module.css";

const RECIPIENT_NOUN = { vndr: "Vndr", venu: "Venu", catr: "Catr" } as const;

/**
 * Organizer-side bottom-sheet detail view for a single inquiry.
 *
 * Model C: once the seller has quoted, the buyer can accept + fund the deposit
 * here (the moment a bare inquiry becomes a cash-backed Confirmed hold), OR
 * reject the counter with a reason (Layer B). The seller's counter is shown as
 * a hero with the delta vs the buyer's original offer; the reason + history sit
 * directly under it, and the accept / reject actions stack at the bottom.
 */

type Props = {
  inquiry: OrgnzInquiry;
  onClose: () => void;
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

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDollars(cents: number | null): string {
  if (cents == null) return "—";
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export function OrgnzInquiryDetailSheet({ inquiry, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [cause, setCause] = useState<InquiryOfferCause | null>(null);
  const [note, setNote] = useState("");

  const noun = RECIPIENT_NOUN[inquiry.recipientType];
  const confirmed = isConfirmedHold(inquiry.depositStatus);
  const canFund =
    !confirmed &&
    inquiry.status === "quoted" &&
    inquiry.depositStatus === "none" &&
    inquiry.proposedPriceCents != null;

  // Counter vs accepted-as-offered vs plain quote, derived from the buyer's
  // original offer (initial_offer_cents) against the seller's number.
  const offer = inquiry.initialOfferCents;
  const price = inquiry.proposedPriceCents;
  const isCounter = offer != null && price != null && price !== offer;
  const isMatch = offer != null && price != null && price === offer;
  const heroLabel = isCounter
    ? "Counter offer"
    : isMatch
      ? "Accepted your offer"
      : `${noun}’s quote`;
  const deltaLine =
    isCounter && offer != null && price != null
      ? `${formatDollars(Math.abs(price - offer))} ${
          price > offer ? "above" : "below"
        } your ${formatDollars(offer)} offer`
      : isMatch
        ? `Matches your ${formatDollars(offer)} offer`
        : null;

  function onFund() {
    setError(null);
    startTransition(async () => {
      const res = await acceptAndFundDeposit(inquiry.id);
      if (!res.ok) setError(res.error);
      // On success the revalidated server data re-renders the sheet's parent.
    });
  }

  function onReject() {
    setError(null);
    if (!cause) {
      setError("Pick a reason for passing.");
      return;
    }
    startTransition(async () => {
      const res = await rejectCounter({
        inquiryId: inquiry.id,
        cause,
        note: note.trim() || null,
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
      <div className={s.drawer} role="dialog" aria-label="Inquiry detail">
        <div className={s.sheetHeader}>
          <div>
            <div className={s.sheetTitle}>
              {inquiry.vendorDisplayName ?? noun}
            </div>
            <div className={s.sheetSubtitle}>
              {formatEventDate(inquiry.eventDate)}
              {" · "}
              {inquiryStatusLabel(inquiry.status)}
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
            <div className={s.sectionLbl}>Your original message</div>
            <div className={s.message}>{inquiry.message}</div>
          </>
        )}

        {price !== null && (
          <div className={s.counterHero}>
            <div className={s.counterLabel}>{heroLabel}</div>
            <div className={s.counterAmount}>{formatDollars(price)}</div>
            {deltaLine && (
              <div
                className={`${s.counterDelta} ${isMatch ? s.counterDeltaMuted : ""}`.trim()}
              >
                {deltaLine}
              </div>
            )}
          </div>
        )}

        {/* Reason + full negotiation history, directly under the offer. */}
        <OfferLedger
          inquiryId={inquiry.id}
          viewerRole="orgnz"
          counterpartyLabel={inquiry.vendorDisplayName ?? noun}
        />

        {confirmed ? (
          <>
            <div className={s.confirmedBadge}>
              ✓ Confirmed hold · escrow funded
            </div>
            <div className={s.confirmedSub}>
              Deposit of {formatDollars(inquiry.depositAmountCents)} is held.
              {inquiry.holdExpiresAt
                ? ` Your date is held through ${formatExpiry(inquiry.holdExpiresAt)}.`
                : ""}
            </div>
          </>
        ) : inquiry.status === "penciled" ? (
          <div className={s.holdBadge}>
            On hold
            {inquiry.expiresAt ? ` · expires ${formatExpiry(inquiry.expiresAt)}` : ""}
          </div>
        ) : null}

        {canFund && !rejecting && (
          <div className={s.fundBlock}>
            <div className={s.fundHint}>
              Accept locks your date with a{" "}
              {formatDollars(Math.round((inquiry.proposedPriceCents ?? 0) * 0.25))}{" "}
              deposit (25% of the {isCounter ? "counter" : "quote"}). Held in
              escrow — refundable per the venue&rsquo;s terms.
            </div>
            <div className={s.actionStack}>
              <button
                type="button"
                className={s.fundCta}
                onClick={onFund}
                disabled={pending}
              >
                {pending ? "Funding…" : "Accept & fund deposit"}
              </button>
              <button
                type="button"
                className={s.rejectCta}
                onClick={() => {
                  setError(null);
                  setRejecting(true);
                }}
                disabled={pending}
              >
                Reject counter
              </button>
            </div>
            {error && <div className={s.fundErr}>{error}</div>}
          </div>
        )}

        {canFund && rejecting && (
          <div className={s.rejectPanel}>
            <div className={s.sectionLbl}>Reason for passing</div>
            <div className={s.chipRow}>
              {INQUIRY_OFFER_BUYER_CAUSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${s.chip} ${cause === c ? s.chipActive : ""}`.trim()}
                  onClick={() => setCause(c)}
                  disabled={pending}
                >
                  {inquiryCauseChipLabel(c, "en", "buyer")}
                </button>
              ))}
            </div>
            <textarea
              className={s.noteInput}
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={600}
              disabled={pending}
              aria-label="Reject note"
            />
            <div className={s.rejectActions}>
              <button
                type="button"
                className={s.btn}
                onClick={() => {
                  setRejecting(false);
                  setError(null);
                }}
                disabled={pending}
              >
                Back
              </button>
              <button
                type="button"
                className={s.rejectConfirm}
                onClick={onReject}
                disabled={pending || !cause}
              >
                {pending ? "Passing…" : "Reject counter"}
              </button>
            </div>
            {error && <div className={s.fundErr}>{error}</div>}
          </div>
        )}

        <OrgnzInquiryThread inquiryId={inquiry.id} />

        <div className={s.footer}>
          <button type="button" className={s.btn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
