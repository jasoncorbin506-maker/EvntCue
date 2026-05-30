"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InquiryStatus } from "@/lib/labels/inquiry-status";
import { respondToCatrInquiry } from "../_actions/respond-to-inquiry";
import { holdCatrInquiry, releaseCatrHold } from "../_actions/hold-inquiry";
import s from "../catr.module.css";

/**
 * Caterer quote + hold panel on the inquiry detail page. Drives the seller
 * side of the early lifecycle:
 *
 *   inquiry / reviewing → price input + Send quote
 *   quoted              → read-only amount + Place hold
 *   penciled            → read-only amount + "Hold · expires …" + Release
 *   inked / booked …    → read-only amount only
 *
 * Mirrors the vndr quote+hold flow (same columns, same transitions). Sits
 * above the message thread so a caterer can price/hold, then keep talking.
 */

type Props = {
  inquiryId: string;
  status: InquiryStatus;
  quotedPriceCents: number | null;
  expiresAt: string | null;
  buyerRole: "orgnz" | "venue";
};

const RESPONDABLE: InquiryStatus[] = ["inquiry", "reviewing"];

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

export function CatrQuotePanel({
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
      const res = await respondToCatrInquiry({ inquiryId, quotedPriceCents: cents });
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
      const res = await holdCatrInquiry(inquiryId);
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
      const res = await releaseCatrHold(inquiryId);
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
        <div className={s.sectionLbl}>Your quote</div>
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
        {error && <div className={s.errMsg}>{error}</div>}
      </div>
    );
  }

  if (quotedPriceCents === null) return null;

  return (
    <div className={s.quotePanel}>
      <div className={s.sectionLbl}>Your quote</div>
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

      {error && <div className={s.errMsg}>{error}</div>}
    </div>
  );
}
