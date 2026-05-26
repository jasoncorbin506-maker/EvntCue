"use client";

import { useState } from "react";
import type { PendingReviewPrompt } from "@/lib/reviews/event-reviews";
import { ReviewSheet } from "./ReviewSheet";
import s from "./OrgnzInquiries.module.css";

/**
 * Organizer dashboard surface for pending review prompts. Mirrors the
 * vndr-side ReviewPromptsCard; uses the orgnz styles vocabulary so it
 * fits the dark portal chrome.
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
    <section
      style={{
        margin: "12px 0",
        padding: "14px 16px",
        background: "var(--ink2)",
        border: "0.5px solid var(--bdr)",
        borderRadius: 12,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <div className={s.sheetTitle}>Reviews to write</div>
        <div className={s.sheetSubtitle}>
          {prompts.length === 1
            ? "1 vendor is waiting"
            : `${prompts.length} vendors waiting`}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {prompts.map((p) => (
          <button
            key={`${p.bookingId}-${p.counterpartyTenantId}`}
            type="button"
            className={s.inqRow}
            onClick={() => setOpenId(p.bookingId)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "#fff" }}>
                {p.counterpartyDisplayName ?? "Vendor"}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--txt3)", marginTop: 2 }}>
                {p.eventName} · {formatEventDate(p.eventDate)}
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, color: "var(--coral)", letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Review →
            </div>
          </button>
        ))}
      </div>
      {openPrompt && (
        <ReviewSheet prompt={openPrompt} onClose={() => setOpenId(null)} />
      )}
    </section>
  );
}
