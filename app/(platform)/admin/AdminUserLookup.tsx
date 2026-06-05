"use client";

import { useState, useTransition } from "react";
import { searchAccounts } from "./_actions/search-accounts";
import { suspendTenant, unsuspendTenant } from "./_actions/suspend-tenant";
import {
  SUSPENSION_REASONS,
  suspensionReasonLabel,
  type SuspensionReason,
} from "@/lib/labels/suspension";
import type { LookupAccount } from "@/lib/admin/lookup";
import s from "./admin.module.css";

/**
 * Admin user lookup — search by email → every tenant behind that login →
 * suspend (with reason taxonomy + optional note) or unsuspend per tenant. The
 * server actions gate on is_admin() + run the lockout guard; this is UI only.
 */
export function AdminUserLookup() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<LookupAccount[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [reason, setReason] = useState<SuspensionReason | null>(null);
  const [note, setNote] = useState("");

  function rerun() {
    startTransition(async () => setResults(await searchAccounts(q)));
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuspendingId(null);
    rerun();
  }

  function resetSuspend() {
    setSuspendingId(null);
    setReason(null);
    setNote("");
    setError(null);
  }

  function doSuspend(tenantId: string) {
    if (!reason) {
      setError("Pick a reason.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await suspendTenant({
        tenantId,
        reason,
        note: note.trim() || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      resetSuspend();
      setResults(await searchAccounts(q));
    });
  }

  function doUnsuspend(tenantId: string) {
    setError(null);
    startTransition(async () => {
      const res = await unsuspendTenant({ tenantId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults(await searchAccounts(q));
    });
  }

  return (
    <div>
      <form onSubmit={onSearch} className={s.lookupForm}>
        <input
          className={s.lookupInput}
          placeholder="Search by email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search accounts by email"
        />
        <button
          type="submit"
          className={s.lookupBtn}
          disabled={pending || q.trim().length < 2}
        >
          {pending ? "…" : "Search"}
        </button>
      </form>

      {error && <div className={s.lookupErr}>{error}</div>}
      {results !== null && results.length === 0 && (
        <div className={s.lookupEmpty}>No accounts match.</div>
      )}

      {results?.map((acc) => (
        <div key={acc.userId} className={s.acct}>
          <div className={s.acctEmail}>{acc.email ?? acc.userId}</div>
          {acc.tenants.length === 0 && (
            <div className={s.lookupEmpty}>No tenants behind this login.</div>
          )}
          {acc.tenants.map((t) => (
            <div key={t.tenantId} className={s.tenantRow}>
              <div className={s.tenantMeta}>
                <span className={s.tenantName}>
                  {t.name ?? t.tenantId.slice(0, 8)}
                </span>
                <span className={s.tenantType}>{t.type ?? "—"}</span>
                {t.suspendedAt && (
                  <span className={s.suspBadge}>
                    Suspended · {suspensionReasonLabel(t.suspendedReason ?? "")}
                  </span>
                )}
              </div>

              {t.suspendedAt ? (
                <button
                  type="button"
                  className={s.unsuspendBtn}
                  onClick={() => doUnsuspend(t.tenantId)}
                  disabled={pending}
                >
                  Unsuspend
                </button>
              ) : suspendingId === t.tenantId ? (
                <div className={s.suspPanel}>
                  <div className={s.chipRow}>
                    {SUSPENSION_REASONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`${s.chip} ${reason === c ? s.chipActive : ""}`.trim()}
                        onClick={() => setReason(c)}
                        disabled={pending}
                      >
                        {suspensionReasonLabel(c)}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className={s.noteInput}
                    placeholder="Note (required for ‘Other’)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    maxLength={600}
                    disabled={pending}
                    aria-label="Suspension note"
                  />
                  <div className={s.suspActions}>
                    <button
                      type="button"
                      className={s.cancelBtn}
                      onClick={resetSuspend}
                      disabled={pending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={s.confirmSuspendBtn}
                      onClick={() => doSuspend(t.tenantId)}
                      disabled={pending || !reason}
                    >
                      {pending ? "…" : "Confirm suspend"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={s.suspendBtn}
                  onClick={() => {
                    resetSuspend();
                    setSuspendingId(t.tenantId);
                  }}
                  disabled={pending}
                >
                  Suspend
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
