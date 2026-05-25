"use client";

import { useEffect, useState } from "react";
import type { CueLadderBranch } from "@/lib/cue/vndr-home-prompt";
import s from "../vndr.module.css";

/**
 * Client-side Cue panel. Server returns the ladder branches in priority
 * order via assembleVndrHomeCue; this component picks the first branch
 * the user hasn't dismissed and renders it with a dismiss × button.
 *
 * Dismiss persistence (session 24, profile-completeness-one-time-cue brief):
 *   - sessionStorage for now — dismiss survives navigation within the
 *     session but reset on browser close. Matches Cowork's brief
 *     recommendation: "if vendor_cue_dismissals doesn't exist yet (V-2c
 *     Session 3), use sessionStorage."
 *   - Upgrade path: V-2c-Phase-4-free Session 3 ships
 *     `vendor_cue_dismissals` table. When that lands, swap the
 *     sessionStorage hook for a server-action call + load
 *     dismissedKeys from page.tsx.
 *
 * Hydration: initial state = branches[0] (so server SSR + first client
 * paint agree). useEffect re-evaluates against sessionStorage and may
 * switch to a later branch or hide the panel. The post-mount swap is a
 * regular React re-render, not a hydration mismatch.
 */

const STORAGE_KEY = "evntcue_cue_dismissed";

type Props = {
  branches: CueLadderBranch[];
};

export function CuePanel({ branches }: Props) {
  // Initial: first branch in ladder. Server + client agree on this.
  const [active, setActive] = useState<CueLadderBranch | null>(
    () => branches[0] ?? null,
  );

  useEffect(() => {
    // Post-mount: read dismissed keys from sessionStorage + adjust.
    const raw =
      typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      setActive(branches[0] ?? null);
      return;
    }
    let dismissed: string[] = [];
    try {
      dismissed = JSON.parse(raw);
      if (!Array.isArray(dismissed)) dismissed = [];
    } catch {
      dismissed = [];
    }
    const dismissedSet = new Set(dismissed);
    const next = branches.find((b) => !dismissedSet.has(b.key)) ?? null;
    setActive(next);
  }, [branches]);

  function handleDismiss() {
    if (!active) return;
    const raw =
      typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    let dismissed: string[] = [];
    if (raw) {
      try {
        dismissed = JSON.parse(raw);
        if (!Array.isArray(dismissed)) dismissed = [];
      } catch {
        dismissed = [];
      }
    }
    if (!dismissed.includes(active.key)) {
      dismissed.push(active.key);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    }
    const dismissedSet = new Set(dismissed);
    const next = branches.find((b) => !dismissedSet.has(b.key)) ?? null;
    setActive(next);
  }

  if (!active) return null;

  return (
    <div className={s.cuePanel}>
      <div className={s.cueIco}>
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
        </svg>
      </div>
      <div className={s.cueBody}>
        <div className={s.cueLbl}>Cue says</div>
        <div className={s.cueTxt}>{active.text}</div>
        {active.action && (
          <div className={s.cueActs}>
            <a href={active.action.href} className={s.cueBtnSm}>
              {active.action.label}
            </a>
          </div>
        )}
      </div>
      <button
        type="button"
        className={s.cueDismiss}
        onClick={handleDismiss}
        aria-label="Dismiss this guidance"
      >
        ×
      </button>
    </div>
  );
}
