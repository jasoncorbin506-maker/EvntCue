"use client";

import { useEffect, useState } from "react";
import {
  inquiryOfferActionLabel,
  inquiryCauseChipLabel,
  inquiryCauseSentence,
} from "@/lib/labels/inquiry-offer";
import type { InquiryOfferRole, InquiryOfferRow } from "@/lib/inquiries/offers";
import { loadInquiryOffers } from "@/lib/inquiries/offers-actions";
import s from "./OfferLedger.module.css";

/**
 * Negotiation timeline (mig 091 inquiry_offers ledger) — the shared read view
 * both portals render inside their inquiry detail sheets. Append-only history of
 * claim / counter / accept / decline actions; whose turn / settled is derived
 * from inquiries.status, not here.
 *
 * `viewerRole` labels the acting party as "You" vs the `counterpartyLabel`. The
 * cause copy flips by side: my own action shows the terse chip ("Already
 * booked"); the other side's shows the receiver-facing sentence ("they're
 * already booked that day", per the Lock 8 non-punishing voice). Silent until
 * there's at least one row — a plain quote with no negotiation renders nothing.
 */

type Props = {
  inquiryId: string;
  viewerRole: InquiryOfferRole;
  counterpartyLabel: string;
};

function formatPrice(cents: number | null): string {
  if (cents === null) return "";
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function OfferLedger({ inquiryId, viewerRole, counterpartyLabel }: Props) {
  const [offers, setOffers] = useState<InquiryOfferRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await loadInquiryOffers(inquiryId);
      if (cancelled) return;
      setOffers(rows);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [inquiryId]);

  if (!loaded || offers.length === 0) return null;

  return (
    <div className={s.wrap}>
      <div className={s.sectionLbl}>Negotiation</div>
      <ol className={s.list}>
        {offers.map((o) => {
          const mine = o.offeredByRole === viewerRole;
          const price = formatPrice(o.priceCents);
          return (
            <li
              key={o.id}
              className={`${s.row} ${mine ? s.rowMine : s.rowTheirs}`.trim()}
            >
              <div className={s.head}>
                <span className={s.who}>{mine ? "You" : counterpartyLabel}</span>
                <span className={s.action}>
                  {inquiryOfferActionLabel(o.action)}
                </span>
                {price && <span className={s.price}>{price}</span>}
                <span className={s.when}>{formatWhen(o.createdAt)}</span>
              </div>
              {o.cause && (
                <div className={s.reason}>
                  {mine
                    ? inquiryCauseChipLabel(o.cause)
                    : capitalize(inquiryCauseSentence(o.cause))}
                </div>
              )}
              {o.note && <div className={s.note}>&ldquo;{o.note}&rdquo;</div>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
