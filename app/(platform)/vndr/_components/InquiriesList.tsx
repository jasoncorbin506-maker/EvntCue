"use client";

import { useMemo, useState } from "react";
import type { VndrInquiry, VndrInquiryStatus } from "@/lib/vndr/inquiries";
import { InquiryDetailSheet } from "./InquiryDetailSheet";
import s from "../vndr.module.css";

/**
 * Inquiries tab — list + filter chips + tap-to-detail. The list is read
 * server-side; this client component owns filter state + the detail sheet
 * open/close.
 *
 * Filter → status mapping per Jason 2026-05-25 session 22 lock:
 *   - Open:   inquiry, reviewing
 *   - Quoted: quoted, penciled
 *   - Booked: inked, booked
 *   - Lost:   closed
 *
 * The detail sheet is rendered conditionally — only when an inquiry is
 * tapped. Closing returns to the list with current filter preserved.
 */

type Filter = "all" | "open" | "quoted" | "booked" | "lost";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  open: "Open",
  quoted: "Quoted",
  booked: "Booked",
  lost: "Lost",
};

const FILTER_STATUSES: Record<Filter, VndrInquiryStatus[] | null> = {
  all: null,
  open: ["inquiry", "reviewing"],
  quoted: ["quoted", "penciled"],
  booked: ["inked", "booked"],
  lost: ["closed"],
};

const STATUS_PILL: Record<VndrInquiryStatus, { label: string; cls: string }> = {
  inquiry: { label: "New", cls: s.pillNew ?? "" },
  reviewing: { label: "Reviewing", cls: s.pillReviewing ?? "" },
  quoted: { label: "Quoted", cls: s.pillQuoted ?? "" },
  penciled: { label: "Penciled", cls: s.pillQuoted ?? "" },
  inked: { label: "Signed", cls: s.pillBooked ?? "" },
  booked: { label: "Booked", cls: s.pillBooked ?? "" },
  closed: { label: "Closed", cls: s.pillLost ?? "" },
};

function formatEventDate(date: string): string {
  if (!date) return "Date TBD";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string): string {
  const created = new Date(iso).getTime();
  const now = Date.now();
  const diffH = (now - created) / (1000 * 60 * 60);
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  const diffD = diffH / 24;
  if (diffD < 7) return `${Math.round(diffD)}d ago`;
  if (diffD < 30) return `${Math.round(diffD / 7)}w ago`;
  return `${Math.round(diffD / 30)}mo ago`;
}

function formatPrice(cents: number | null): string {
  if (cents === null) return "";
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

type Props = {
  inquiries: VndrInquiry[];
};

export function InquiriesList({ inquiries }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const allowed = FILTER_STATUSES[filter];
    if (allowed === null) return inquiries;
    return inquiries.filter((i) => allowed.includes(i.status));
  }, [inquiries, filter]);

  // Counts per filter for the chip badges.
  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: inquiries.length,
      open: 0,
      quoted: 0,
      booked: 0,
      lost: 0,
    };
    for (const inq of inquiries) {
      if (FILTER_STATUSES.open!.includes(inq.status)) c.open++;
      else if (FILTER_STATUSES.quoted!.includes(inq.status)) c.quoted++;
      else if (FILTER_STATUSES.booked!.includes(inq.status)) c.booked++;
      else if (FILTER_STATUSES.lost!.includes(inq.status)) c.lost++;
    }
    return c;
  }, [inquiries]);

  const openInquiry = openId
    ? inquiries.find((i) => i.id === openId) ?? null
    : null;

  return (
    <div className={s.tabBody}>
      <div className={s.filterRow} role="tablist">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={`${s.filterChip} ${filter === f ? s.filterChipOn : ""}`.trim()}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]}
            {counts[f] > 0 && <span className={s.filterCount}>{counts[f]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={s.emptyState}>
          {filter === "all"
            ? "No inquiries yet. New leads will show up here as organizers reach out."
            : `No ${FILTER_LABELS[filter].toLowerCase()} inquiries right now.`}
        </div>
      ) : (
        <div className={s.inqList}>
          {filtered.map((inq) => {
            const pill = STATUS_PILL[inq.status];
            return (
              <button
                key={inq.id}
                type="button"
                className={s.inqRow}
                onClick={() => setOpenId(inq.id)}
              >
                <div className={s.inqRowTop}>
                  <span className={s.inqDate}>
                    {formatEventDate(inq.eventDate)}
                  </span>
                  <span className={`${s.statusPill} ${pill.cls}`.trim()}>
                    {pill.label}
                  </span>
                </div>
                <div className={s.inqRowMid}>
                  {inq.guestCount > 0 ? `${inq.guestCount} guests` : "Guest count TBD"}
                  {inq.proposedPriceCents !== null && (
                    <>
                      {" · "}
                      <b>{formatPrice(inq.proposedPriceCents)}</b>
                    </>
                  )}
                </div>
                {inq.message && (
                  <div className={s.inqMsg}>
                    {inq.message.length > 110
                      ? inq.message.slice(0, 110).trim() + "…"
                      : inq.message}
                  </div>
                )}
                <div className={s.inqRowFoot}>
                  {formatRelative(inq.createdAt)}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {openInquiry && (
        <InquiryDetailSheet
          inquiry={openInquiry}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
