"use client";

import { useState, useTransition } from "react";
import { acceptPlnrInvite } from "../_actions/accept-invite";
import type { IncomingPlnrInvite } from "@/lib/plnr/invites";
import s from "../plnr.module.css";

/**
 * One incoming planner invite (Lock 30 Phase C pt 2). View-only context (message
 * + when it arrived) with an Accept action that stamps accepted_at on the row.
 * Cross-tenant event-title enrichment is out of scope (the planner has no read
 * on buyer events yet), so the heading is generic.
 */
function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PlnrInviteRow({ invite }: { invite: IncomingPlnrInvite }) {
  const [accepted, setAccepted] = useState(invite.acceptedAt != null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onAccept() {
    setError(null);
    startTransition(async () => {
      const res = await acceptPlnrInvite(invite.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAccepted(true);
    });
  }

  return (
    <div className={s.inviteRow}>
      <div className={s.inviteHead}>
        <div className={s.inviteTitle}>Planning invite</div>
        {accepted ? (
          <span className={s.inviteAccepted}>✓ Accepted</span>
        ) : (
          <span className={s.inviteWhen}>{relTime(invite.createdAt)}</span>
        )}
      </div>

      {invite.message && <div className={s.inviteMsg}>{invite.message}</div>}

      {!accepted && (
        <button type="button" className={s.acceptBtn} onClick={onAccept} disabled={pending}>
          {pending ? "Accepting…" : "Accept invite"}
        </button>
      )}

      {error && <div className={s.inviteErr}>{error}</div>}
    </div>
  );
}
