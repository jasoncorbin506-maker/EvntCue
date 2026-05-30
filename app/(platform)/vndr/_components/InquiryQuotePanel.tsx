"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToInquiry } from "../_actions/respond-to-inquiry";
import { holdInquiry, releaseHold } from "../_actions/hold-inquiry";
import type { VndrInquiryStatus } from "@/lib/vndr/inquiries";
import s from "../vndr.module.css";

/**
 * Vendor quote + hold panel on the inquiry detail page (the in-list
 * InquiryDetailSheet has its own quote control; this is the deep-link/full-page
 * equivalent). Drives the seller side of the early lifecycle:
 *
 *   inquiry / reviewing → price input + Send quote
 *   quoted              → read-only amount + Place hold
 *   penciled            → read-only amount + "Hold · expires …" + Release
 *   inked / booked …    → read-only amount only
 *
 * Sits above the message thread.
 */

type Props = {
  inquiryId: string;
  status: VndrInquiryStatus;
  quotedPriceCents: number | null;
  expiresAt: string | null;
  buyerRole: "orgnz" | "venue";
};

const RESPONDABLE: VndrInquiryStatus[] = ["inquiry", "reviewing"];

function buyerLabel(buyerRole: "orgnz" | "venue"): string {
  return buyerRole === "venue" ? "Venu" : "Orgnz";
}

function formatPriceInput(cents: number | null): string {
  if (cents === null || cents === 0) return "";
  return (cents / 100).toFixed(0);
}

function formatPriceDisplay(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function InquiryQuotePanel({
  inquiryId,
  status,
  quotedPriceCents,
  expiresAt,
  buyerRole,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [priceStr, setPriceStr] = useState(formatPriceInput(quotedPriceCents));
  const [error, setError] = useState<string | null>(null);

  const canRespond = RESPONDABLE.includes(status);

  function handleSubmit() {
    setError(null);
    const dollars = Number(priceStr);
    if (!priceStr || !Number.isFinite(dollars) || dollars < 0) {
      setError("Enter a price in whole dollars.");
      return;
    }
    const cents = Math.round(dollars * 100);
    startTransition(async () => {
      const res = await respondToInquiry({ inquiryId, quotedPriceCents: cents });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleHold() {
    setError(null);
    startTransition(async () => {
      const res = await holdInquiry(inquiryId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRelease() {
    setError(null);
    startTransition(async () => {
      const res = await releaseHold(inquiryId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (canRespond) {
    return (
      <div className={s.quotePanel}>
        <div className={s.quoteLbl}>Your quote</div>
        <div className={s.quoteRow}>
          <span className={s.quoteDollar}>$</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            placeholder="0"
            className={s.quoteInput}
            disabled={pending}
            aria-label="Quote amount in dollars"
          />
          <button
            type="button"
            className={s.quoteSend}
            onClick={handleSubmit}
            disabled={pending || priceStr.trim().length === 0}
          >
            {pending ? "Sending…" : "Send quote"}
          </button>
        </div>
        <div className={s.quoteHint}>
          Sent now — the {buyerLabel(buyerRole).toLowerCase()} sees your price and can accept.
        </div>
        {error && <div className={s.quoteErr}>{error}</div>}
      </div>
    );
  }

  if (quotedPriceCents === null) return null;

  return (
    <div className={s.quotePanel}>
      <div className={s.quoteLbl}>Your quote</div>
      <div className={s.quoteReadonly}>{formatPriceDisplay(quotedPriceCents)}</div>

      {status === "quoted" && (
        <button
          type="button"
          className={s.holdBtn}
          onClick={handleHold}
          disabled={pending}
        >
          {pending ? "Placing…" : "Place hold"}
        </button>
      )}

      {status === "penciled" && (
        <div className={s.holdRow}>
          <span className={s.holdBadge}>
            Hold{expiresAt ? ` · expires ${formatExpiry(expiresAt)}` : ""}
          </span>
          <button
            type="button"
            className={s.holdRelease}
            onClick={handleRelease}
            disabled={pending}
          >
            {pending ? "Releasing…" : "Release hold"}
          </button>
        </div>
      )}

      {error && <div className={s.quoteErr}>{error}</div>}
    </div>
  );
}
