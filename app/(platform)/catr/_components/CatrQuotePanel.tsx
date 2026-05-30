"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InquiryStatus } from "@/lib/labels/inquiry-status";
import { respondToCatrInquiry } from "../_actions/respond-to-inquiry";
import s from "../catr.module.css";

/**
 * Caterer quote panel on the inquiry detail page. When the inquiry is still
 * open (status 'inquiry' or 'reviewing') it shows a price input + Send; once
 * quoted it shows the read-only amount. Mirrors the vndr quote flow — same
 * proposed_price_cents column, same allowed transitions. Sits above the
 * message thread so a caterer can price first, then keep talking.
 */

type Props = {
  inquiryId: string;
  status: InquiryStatus;
  quotedPriceCents: number | null;
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

export function CatrQuotePanel({ inquiryId, status, quotedPriceCents, buyerRole }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [priceStr, setPriceStr] = useState(formatPriceInput(quotedPriceCents));
  const [error, setError] = useState<string | null>(null);

  const canRespond = RESPONDABLE.includes(status);

  if (!canRespond) {
    if (quotedPriceCents === null) return null;
    return (
      <div className={s.quotePanel}>
        <div className={s.sectionLbl}>Your quote</div>
        <div className={s.quoteReadonly}>{formatPriceDisplay(quotedPriceCents)}</div>
      </div>
    );
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
      const res = await respondToCatrInquiry({ inquiryId, quotedPriceCents: cents });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

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
