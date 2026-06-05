"use client";

import { useState, useTransition } from "react";
import { resolveAppeal } from "./_actions/resolve-appeal";
import { suspensionReasonLabel } from "@/lib/labels/suspension";
import type { OpenAppeal } from "@/lib/admin/appeals";
import s from "./admin.module.css";

/**
 * Appeals review — both sides in one card (their statement vs the original
 * suspension reason) → Uphold (stay suspended) or Reinstate (unsuspend). The
 * action gates on is_admin() + revalidates, so the list refreshes on resolve.
 */
export function AdminAppeals({ appeals }: { appeals: OpenAppeal[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (appeals.length === 0) {
    return <div className={s.lookupEmpty}>No open appeals.</div>;
  }

  function resolve(appealId: string, decision: "uphold" | "reinstate") {
    setError(null);
    startTransition(async () => {
      const res = await resolveAppeal({ appealId, decision });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div>
      {error && <div className={s.lookupErr}>{error}</div>}
      {appeals.map((a) => (
        <div key={a.id} className={s.appeal}>
          <div className={s.appealHead}>
            <span className={s.tenantName}>
              {a.tenantName ?? a.tenantId.slice(0, 8)}
            </span>
            <span className={s.tenantType}>{a.tenantType ?? "—"}</span>
            <span className={s.appealReason}>
              Suspended · {suspensionReasonLabel(a.suspendedReason ?? "")}
            </span>
          </div>
          {a.suspendedNote && (
            <div className={s.appealNote}>Note: {a.suspendedNote}</div>
          )}
          <div className={s.appealStatement}>&ldquo;{a.statement}&rdquo;</div>
          {a.contactEmail && (
            <div className={s.appealContact}>Reply-to: {a.contactEmail}</div>
          )}
          <div className={s.appealActions}>
            <button
              type="button"
              className={s.cancelBtn}
              onClick={() => resolve(a.id, "uphold")}
              disabled={pending}
            >
              Uphold
            </button>
            <button
              type="button"
              className={s.confirmSuspendBtn}
              onClick={() => resolve(a.id, "reinstate")}
              disabled={pending}
              style={{ borderColor: "var(--teal)", background: "var(--teal)" }}
            >
              {pending ? "…" : "Reinstate"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
