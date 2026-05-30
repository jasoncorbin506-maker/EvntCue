"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToInquiry } from "../_actions/respond-to-inquiry";
import type { VndrInquiryStatus } from "@/lib/vndr/inquiries";
import s from "../vndr.module.css";

/**
 * Vendor quote panel on the inquiry detail page. The in-list
 * InquiryDetailSheet has its own quote control; this is the deep-link/full-page
 * equivalent. When the inquiry is open (status 'inquiry'/'reviewing') it shows
 * a price input + Send; once quoted it shows the read-only amount. Sits above
 * the message thread.
 */

type Props = {
  inquiryId: string;
  status: VndrInquiryStatus;
  quotedPriceCents: number | null;
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

export function InquiryQuotePanel({ inquiryId, status, quotedPriceCents, buyerRole }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [priceStr, setPriceStr] = useState(formatPriceInput(quotedPriceCents));
  const [error, setError] = useState<string | null>(null);

  const canRespond = RESPONDABLE.includes(status);

  if (!canRespond) {
    if (quotedPriceCents === null) return null;
    return (
      <div className={s.quotePanel}>
        <div className={s.quoteLbl}>Your quote</div>
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
      const res = await respondToInquiry({ inquiryId, quotedPriceCents: cents });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

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
