"use client";

import { useState } from "react";
import { InquiryRow } from "./InquiryRow";
import {
  DEMO_INQUIRIES,
  SEGMENT_LABELS,
  segmentFor,
  type InquirySegment,
} from "../_lib/demo-data";
import s from "../venu.module.css";

/**
 * Inquiries-tab segment control + filtered row list.
 *
 * Client component because the segment filter is local UI state (no need to
 * round-trip via URL params for a stub-data eyeball). When real reads land
 * we'll likely swap this for a server component + `?segment=` query param
 * to keep state shareable; for chunk B local state is enough.
 *
 * Segments per Venu_Locked_2026-05-13.md row 2:
 *  - New      → status ∈ {inquiry, reviewing}
 *  - Quoted   → status = quoted
 *  - Held     → status ∈ {penciled, inked}
 *  - Closed   → status ∈ {booked, closed}
 */
const ORDER: InquirySegment[] = ["new", "quoted", "held", "closed"];

export function InquiriesSegment() {
  const [active, setActive] = useState<InquirySegment>("new");
  const counts: Record<InquirySegment, number> = { new: 0, quoted: 0, held: 0, closed: 0 };
  for (const inq of DEMO_INQUIRIES) counts[segmentFor(inq.status)]++;

  const filtered = DEMO_INQUIRIES.filter((inq) => segmentFor(inq.status) === active);

  return (
    <>
      <div className={s.segment}>
        {ORDER.map((seg) => (
          <button
            key={seg}
            type="button"
            className={`${s.segmentTab} ${active === seg ? s.segmentTabActive : ""}`}
            onClick={() => setActive(seg)}
            aria-pressed={active === seg}
          >
            {SEGMENT_LABELS[seg]}
            {counts[seg] > 0 && <span className={s.segmentCount}>{counts[seg]}</span>}
          </button>
        ))}
      </div>

      <div className={s.inqList}>
        {filtered.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyTitle}>Nothing here yet</div>
            <div className={s.emptyBody}>
              No {SEGMENT_LABELS[active].toLowerCase()} inquiries right now.
            </div>
          </div>
        ) : (
          filtered.map((inq) => <InquiryRow key={inq.id} inquiry={inq} />)
        )}
      </div>
    </>
  );
}
