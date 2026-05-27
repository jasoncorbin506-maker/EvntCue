"use client";

import { useState } from "react";
import type { PendingReviewPrompt } from "@/lib/reviews/event-reviews-shared";
import { ReviewSheet } from "./ReviewSheet";
import s from "./ReviewPromptsCard.module.css";

/**
 * Dashboard card that surfaces pending review prompts (events past T+24h
 * the vendor hasn't reviewed yet). Tapping a row opens ReviewSheet with
 * the prompt context. Empty/no-prompts state: this card simply doesn't
 * render — caller (vndr/page.tsx) checks `prompts.length > 0` before
 * mounting.
 *
 * V-2c Session 2 Stream A. Per Lock 24 trust-score formula, reviews
 * sub-metric (40% weight) unblocks once vendors start collecting them
 * — surfacing the prompt is the prerequisite to that flywheel.
 */

type Props = {
  prompts: PendingReviewPrompt[];
};

function formatEventDate(date: string): string {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ReviewPromptsCard({ prompts }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openPrompt = openId
    ? prompts.find((p) => p.bookingId === openId) ?? null
    : null;

  return (
    <section className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardTitle}>Reviews to write</div>
        <div className={s.cardSubtitle}>
          {prompts.length === 1
            ? "1 organizer is waiting"
            : `${prompts.length} organizers waiting`}
        </div>
      </div>
      <div className={s.list}>
        {prompts.map((p) => (
          <button
            key={p.bookingId}
            type="button"
            className={s.row}
            onClick={() => setOpenId(p.bookingId)}
          >
            <div className={s.rowMain}>
              <div className={s.rowName}>
                {p.counterpartyDisplayName ?? "Organizer"}
              </div>
              <div className={s.rowMeta}>
                {p.eventName} · {formatEventDate(p.eventDate)}
              </div>
            </div>
            <div className={s.rowCta}>Review →</div>
          </button>
        ))}
      </div>
      {openPrompt && (
        <ReviewSheet prompt={openPrompt} onClose={() => setOpenId(null)} />
      )}
    </section>
  );
}
