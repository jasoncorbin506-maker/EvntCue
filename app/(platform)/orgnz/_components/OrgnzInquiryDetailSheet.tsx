"use client";

import { useState, useTransition } from "react";
import type { OrgnzInquiry } from "@/lib/orgnz/inquiries";
import { inquiryStatusLabel } from "@/lib/labels/inquiry-status";
import { isConfirmedHold } from "@/lib/labels/deposit-status";
import { acceptAndFundDeposit } from "../_actions/fund-deposit";
import { OrgnzInquiryThread } from "./OrgnzInquiryThread";
import { OfferLedger } from "../../_components/OfferLedger";
import s from "./OrgnzInquiries.module.css";

const RECIPIENT_NOUN = { vndr: "Vndr", venu: "Venu", catr: "Catr" } as const;

/**
 * Organizer-side bottom-sheet detail view for a single inquiry.
 *
 * Model C: once the seller has quoted, the buyer can "Accept & fund deposit"
 * here — the moment a bare inquiry becomes a cash-backed Confirmed hold. Money
 * is STUBBED pre-Stripe (the action only stamps deposit state). A funded
 * inquiry shows a teal Confirmed-hold badge instead of the CTA.
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

function formatPriceDisplay(cents: number | null): string {
  if (cents === null) return "—";
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
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

  const noun = RECIPIENT_NOUN[inquiry.recipientType];
  const confirmed = isConfirmedHold(inquiry.depositStatus);
  const canFund =
    !confirmed &&
    inquiry.status === "quoted" &&
    inquiry.depositStatus === "none" &&
    inquiry.proposedPriceCents != null;

  function onFund() {
    setError(null);
    startTransition(async () => {
      const res = await acceptAndFundDeposit(inquiry.id);
      if (!res.ok) setError(res.error);
      // On success the revalidated server data re-renders the sheet's parent.
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

        {inquiry.proposedPriceCents !== null && (
          <>
            <div className={s.sectionLbl}>{noun}&rsquo;s quote</div>
            <div className={s.priceReadonly}>
              {formatPriceDisplay(inquiry.proposedPriceCents)}
            </div>
          </>
        )}

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

        {canFund && (
          <div className={s.fundBlock}>
            <div className={s.fundHint}>
              Lock in your date with a{" "}
              {formatDollars(Math.round((inquiry.proposedPriceCents ?? 0) * 0.25))}{" "}
              deposit (25% of the quote). Held in escrow — refundable per the
              venue&rsquo;s terms.
            </div>
            <button
              type="button"
              className={s.fundCta}
              onClick={onFund}
              disabled={pending}
            >
              {pending ? "Funding…" : "Accept & fund deposit"}
            </button>
            {error && <div className={s.fundErr}>{error}</div>}
          </div>
        )}

        <OfferLedger
          inquiryId={inquiry.id}
          viewerRole="orgnz"
          counterpartyLabel={inquiry.vendorDisplayName ?? noun}
        />

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
