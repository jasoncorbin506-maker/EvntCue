"use client";

import { useState, useTransition } from "react";
import { respondToInquiry } from "../_actions/respond-to-inquiry";
import { declineInquiry } from "../_actions/decline-inquiry";
import { quickClaimInquiry } from "../_actions/quick-claim-inquiry";
import { counterInquiry } from "../_actions/counter-inquiry";
import { isConfirmedHold } from "@/lib/labels/deposit-status";
import {
  INQUIRY_OFFER_CAUSES,
  inquiryCauseChipLabel,
  type InquiryOfferCause,
} from "@/lib/labels/inquiry-offer";
import type { VndrInquiry, VndrInquiryStatus } from "@/lib/vndr/inquiries";
import { InquiryThread } from "./InquiryThread";
import { OfferLedger } from "../../_components/OfferLedger";
import s from "./InquiryDetailSheet.module.css";

/**
 * Bottom-sheet detail view for a single inquiry. Opened from an InquiryRow
 * tap in InquiriesList. Surfaces:
 *
 *   - Event date + guest count + auto-populated brief (mig 091) + message
 *   - Confirmed-hold banner when escrow is funded (Model C)
 *   - Negotiation actions (Layer B) when the buyer attached an offer:
 *       Quick Claim (take their number) · Counter (price + reason) · Pass (reason)
 *   - Legacy one-shot quote + decline when there's no structured offer
 *   - The shared OfferLedger timeline + message thread
 *
 * Same scrim + drawer pattern as AvailabilityBlockSheet. Lock 22 holds —
 * any submit error inlines; never blocks the close action.
 */

type Props = {
  inquiry: VndrInquiry;
  onClose: () => void;
};

type Mode = "idle" | "counter" | "pass";

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

function formatHoldThrough(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function titleCase(v: string | null): string | null {
  if (!v) return null;
  return v
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDuration(min: number | null): string | null {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h} hr${h > 1 ? "s" : ""}`;
  return `${m} min`;
}

function joinParts(parts: (string | null)[], sep: string): string | null {
  const kept = parts.filter((p): p is string => Boolean(p));
  return kept.length ? kept.join(sep) : null;
}

export function InquiryDetailSheet({ inquiry, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [priceStr, setPriceStr] = useState(
    formatPriceInput(inquiry.proposedPriceCents),
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [cause, setCause] = useState<InquiryOfferCause | null>(null);
  const [note, setNote] = useState("");

  const canRespond = RESPONDABLE.includes(inquiry.status);
  const canDecline = DECLINABLE.includes(inquiry.status);
  const confirmed = isConfirmedHold(inquiry.depositStatus);
  const hasOffer =
    inquiry.initialOfferCents != null && inquiry.initialOfferCents > 0;
  // Structured negotiation only when the buyer attached an offer; otherwise the
  // legacy one-shot quote / decline holds.
  const showNegotiation = canRespond && hasOffer;
  const counterpartyLabel = inquiry.buyerRole === "venue" ? "Venu" : "Orgnz";

  // Auto-populated brief (mig 091) — structured event context, shown whenever
  // any field is present (offer line gates separately on the offer).
  const typeLabel = joinParts(
    [titleCase(inquiry.eventType), titleCase(inquiry.eventSubtype)],
    " · ",
  );
  const durationLabel = formatDuration(inquiry.durationMinutes);
  const whereLabel = joinParts([inquiry.venueCity, inquiry.venueState], ", ");
  const hasBrief =
    hasOffer || Boolean(typeLabel) || Boolean(durationLabel) || Boolean(whereLabel);

  function resetMode() {
    setMode("idle");
    setError(null);
    setCause(null);
    setNote("");
  }

  function startCounter() {
    setError(null);
    setCause(null);
    setNote("");
    setPriceStr(formatPriceInput(inquiry.initialOfferCents));
    setMode("counter");
  }

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

  function handleQuickClaim() {
    setError(null);
    startTransition(async () => {
      const res = await quickClaimInquiry(inquiry.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  function handleCounter() {
    setError(null);
    const dollars = Number(priceStr);
    if (!priceStr || !Number.isFinite(dollars) || dollars < 0) {
      setError("Enter a counter price in whole dollars.");
      return;
    }
    if (!cause) {
      setError("Pick a reason for your counter.");
      return;
    }
    const cents = Math.round(dollars * 100);
    startTransition(async () => {
      const res = await counterInquiry({
        inquiryId: inquiry.id,
        priceCents: cents,
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

  function runDecline(
    declineCause?: InquiryOfferCause | null,
    declineNote?: string | null,
  ) {
    setError(null);
    startTransition(async () => {
      const res = await declineInquiry(
        inquiry.id,
        declineCause ? { cause: declineCause, note: declineNote ?? null } : undefined,
      );
      if (!res.ok) {
        setError(res.error);
        setConfirmDecline(false);
        return;
      }
      onClose();
    });
  }

  const causeChips = (
    <div className={s.chipRow}>
      {INQUIRY_OFFER_CAUSES.map((c) => (
        <button
          key={c}
          type="button"
          className={`${s.chip} ${cause === c ? s.chipActive : ""}`.trim()}
          onClick={() => setCause(c)}
          disabled={pending}
        >
          {inquiryCauseChipLabel(c)}
        </button>
      ))}
    </div>
  );

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

        {confirmed && (
          <div className={s.holdBanner}>
            <div className={s.holdBannerTitle}>✓ Confirmed hold · escrow funded</div>
            <div className={s.holdBannerBody}>
              This buyer has a deposit on file
              {inquiry.depositAmountCents != null
                ? ` (${formatPriceDisplay(inquiry.depositAmountCents)} held)`
                : ""}
              .
              {inquiry.holdExpiresAt
                ? ` Date held through ${formatHoldThrough(inquiry.holdExpiresAt)}.`
                : ""}{" "}
              A qualified, cash-backed booking — not a tire-kicker.
            </div>
          </div>
        )}

        {hasBrief && (
          <div className={s.brief}>
            {hasOffer && (
              <div className={s.briefOffer}>
                <span className={s.briefOfferLabel}>Their offer</span>
                <span className={s.briefOfferValue}>
                  {formatPriceDisplay(inquiry.initialOfferCents)}
                </span>
              </div>
            )}
            <div className={s.briefRows}>
              {typeLabel && (
                <div className={s.briefRow}>
                  <span className={s.briefKey}>Type</span>
                  <span className={s.briefVal}>{typeLabel}</span>
                </div>
              )}
              {durationLabel && (
                <div className={s.briefRow}>
                  <span className={s.briefKey}>Length</span>
                  <span className={s.briefVal}>{durationLabel}</span>
                </div>
              )}
              {whereLabel && (
                <div className={s.briefRow}>
                  <span className={s.briefKey}>Where</span>
                  <span className={s.briefVal}>{whereLabel}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {inquiry.message && (
          <>
            <div className={s.sectionLbl}>
              Message from {inquiry.buyerRole === "venue" ? "Venu" : "Orgnz"}
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

        {/* Layer B — structured negotiation when the buyer attached an offer. */}
        {showNegotiation && mode === "idle" && (
          <>
            <div className={s.sectionLbl}>Your response</div>
            <button
              type="button"
              className={`${s.btn} ${s.btnPrimary} ${s.fullBtn}`}
              onClick={handleQuickClaim}
              disabled={pending}
            >
              {pending
                ? "…"
                : `Quick Claim ${formatPriceDisplay(inquiry.initialOfferCents)}`}
            </button>
            <div className={s.actionRow}>
              <button
                type="button"
                className={`${s.btn} ${s.btnGhost} ${s.grow}`}
                onClick={startCounter}
                disabled={pending}
              >
                Counter
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.grow}`}
                onClick={() => {
                  setError(null);
                  setCause(null);
                  setNote("");
                  setMode("pass");
                }}
                disabled={pending}
              >
                Pass
              </button>
            </div>
            <div className={s.hint}>
              Quick Claim takes their{" "}
              {formatPriceDisplay(inquiry.initialOfferCents)} as your quote.
              Counter to propose a different number with a reason.
            </div>
          </>
        )}

        {showNegotiation && mode === "counter" && (
          <>
            <div className={s.sectionLbl}>Your counter</div>
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
                aria-label="Counter amount in dollars"
              />
            </div>
            <div className={s.sectionLbl}>Why a different number?</div>
            {causeChips}
            <textarea
              className={s.noteInput}
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={600}
              disabled={pending}
              aria-label="Counter note"
            />
            <div className={s.actionRow}>
              <button
                type="button"
                className={`${s.btn} ${s.grow}`}
                onClick={resetMode}
                disabled={pending}
              >
                Back
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.btnPrimary} ${s.grow}`}
                onClick={handleCounter}
                disabled={pending || !cause}
              >
                {pending ? "Sending…" : "Send counter"}
              </button>
            </div>
          </>
        )}

        {showNegotiation && mode === "pass" && (
          <>
            <div className={s.sectionLbl}>Reason for passing</div>
            {causeChips}
            <textarea
              className={s.noteInput}
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={600}
              disabled={pending}
              aria-label="Pass note"
            />
            <div className={s.actionRow}>
              <button
                type="button"
                className={`${s.btn} ${s.grow}`}
                onClick={resetMode}
                disabled={pending}
              >
                Back
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.btnDanger} ${s.grow}`}
                onClick={() => runDecline(cause, note.trim() || null)}
                disabled={pending || !cause}
              >
                {pending ? "Passing…" : "Pass"}
              </button>
            </div>
          </>
        )}

        {/* Legacy one-shot quote — no structured offer on the inquiry. */}
        {canRespond && !hasOffer && (
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
              Sent now — the {counterpartyLabel} sees your price and can accept.
            </div>
          </>
        )}

        {error && <div className={s.errMsg}>{error}</div>}

        <OfferLedger
          inquiryId={inquiry.id}
          viewerRole="vndr"
          counterpartyLabel={counterpartyLabel}
        />

        <InquiryThread inquiryId={inquiry.id} buyerRole={inquiry.buyerRole} />

        {/* Footer: negotiation modes carry their own buttons; otherwise the
            legacy quote/decline footer + decline-confirm flow. */}
        {showNegotiation ? (
          mode === "idle" && (
            <div className={s.footer}>
              <button type="button" className={s.btn} onClick={onClose}>
                Close
              </button>
            </div>
          )
        ) : confirmDecline ? (
          <div className={s.declineConfirm}>
            <div className={s.declineConfirmTxt}>
              Decline this inquiry? It will move to <b>Lost</b> and you
              won&apos;t be able to respond to it later.
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
                onClick={() => runDecline()}
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
            {canRespond && !hasOffer && (
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
