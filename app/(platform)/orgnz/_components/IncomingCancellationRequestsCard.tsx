"use client";

import { useState } from "react";
import type { PendingCancellationForOrganizer } from "@/lib/bookings/cancellation-requests-shared";
import { IncomingCancellationRequestSheet } from "./IncomingCancellationRequestSheet";
import s from "./OrgnzInquiries.module.css";

/**
 * Dashboard surface listing pending vendor cancellation requests on the
 * organizer's bookings. Tapping a row opens IncomingCancellationRequestSheet
 * with the approve/deny CTAs. Empty state: card doesn't render (caller
 * gates on `requests.length > 0`).
 */

type Props = {
  requests: PendingCancellationForOrganizer[];
};

function formatRelative(iso: string): string {
  const created = new Date(iso).getTime();
  const diffH = (Date.now() - created) / (1000 * 60 * 60);
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  const diffD = diffH / 24;
  if (diffD < 7) return `${Math.round(diffD)}d ago`;
  return `${Math.round(diffD / 7)}w ago`;
}

export function IncomingCancellationRequestsCard({ requests }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openRequest = openId
    ? requests.find((r) => r.id === openId) ?? null
    : null;

  return (
    <section
      style={{
        margin: "12px 0",
        padding: "14px 16px",
        background: "var(--ink2)",
        border: "0.5px solid rgba(197, 66, 52, 0.4)",
        borderRadius: 12,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <div className={s.sheetTitle} style={{ color: "#fff" }}>
          Cancellation requests
        </div>
        <div className={s.sheetSubtitle}>
          {requests.length === 1
            ? "1 vendor wants to cancel"
            : `${requests.length} vendors want to cancel`}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {requests.map((r) => (
          <button
            key={r.id}
            type="button"
            className={s.inqRow}
            onClick={() => setOpenId(r.id)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "#fff" }}>
                {r.vendorDisplayName ?? "Vendor"}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--txt3)", marginTop: 2 }}>
                {r.eventName} · filed {formatRelative(r.createdAt)}
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, color: "var(--coral)", letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Respond →
            </div>
          </button>
        ))}
      </div>
      {openRequest && (
        <IncomingCancellationRequestSheet
          request={openRequest}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}
