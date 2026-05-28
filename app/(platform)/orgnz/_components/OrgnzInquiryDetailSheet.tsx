"use client";

import type { OrgnzInquiry } from "@/lib/orgnz/inquiries";
import { inquiryStatusLabel } from "@/lib/labels/inquiry-status";
import { OrgnzInquiryThread } from "./OrgnzInquiryThread";
import s from "./OrgnzInquiries.module.css";

/**
 * Organizer-side bottom-sheet detail view for a single inquiry. The
 * orgnz side doesn't author quotes or decline (the vendor does that),
 * so this sheet is essentially a thread surface + read-only context
 * (vendor name, status, vendor's quote price if any).
 *
 * Quote acceptance, cancellation requests, and other forward actions
 * land in later V-2c sessions per the parent brief.
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

export function OrgnzInquiryDetailSheet({ inquiry, onClose }: Props) {
  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label="Inquiry detail">
        <div className={s.sheetHeader}>
          <div>
            <div className={s.sheetTitle}>
              {inquiry.vendorDisplayName ?? "Vendor"}
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
            <div className={s.sectionLbl}>Vendor&rsquo;s quote</div>
            <div className={s.priceReadonly}>
              {formatPriceDisplay(inquiry.proposedPriceCents)}
            </div>
          </>
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
