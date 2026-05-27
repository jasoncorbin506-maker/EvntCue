"use client";

import { useMemo, useState, useTransition } from "react";
import type { CueLadderBranch } from "@/lib/cue/vndr-home-prompt";
import { dismissVendorCue } from "../_actions/dismiss-vendor-cue";
import s from "../vndr.module.css";

/**
 * Client-side Cue panel. Server returns the ladder branches in priority
 * order via assembleVndrHomeCue, plus the set of keys the vendor has
 * already dismissed (loaded from vendor_cue_dismissals, mig 064). This
 * component picks the first non-dismissed branch and renders it with a
 * dismiss × button.
 *
 * V-2c Session 3 (mig 064): dismiss is now permanent + cross-device via
 * dismissVendorCue server action. Replaces session 24's sessionStorage
 * path.
 *
 * Hydration: server-side filtering means the initial render already
 * skips dismissed branches — no useEffect adjustment needed. Local
 * dismiss-in-flight state is layered on top so the next branch surfaces
 * immediately while the action posts.
 */

type Props = {
  branches: CueLadderBranch[];
  dismissedKeys: string[];
};

export function CuePanel({ branches, dismissedKeys }: Props) {
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(
    () => new Set(dismissedKeys),
  );
  const [, startTransition] = useTransition();

  const active = useMemo<CueLadderBranch | null>(
    () => branches.find((b) => !localDismissed.has(b.key)) ?? null,
    [branches, localDismissed],
  );

  function handleDismiss() {
    if (!active) return;
    const key = active.key;
    // Optimistic: advance the panel immediately, then persist.
    setLocalDismissed((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    startTransition(async () => {
      await dismissVendorCue(key);
    });
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
