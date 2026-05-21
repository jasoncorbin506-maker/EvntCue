"use client";

import s from "../mood-board.module.css";
import type { CanvasLabels } from "./MoodBoardCanvas";

type Props = {
  labels: CanvasLabels;
};

/**
 * Mood Board top bar — brand + board name + privacy badge on the left,
 * "Tidy board" + "See your event in frames · $9.99" CTA on the right.
 *
 * Render button is stubbed-disabled in Chunk A. Chunk D wires the Flux
 * 2 Pro render flow + Stripe one-time charge.
 */
export function TopBar({ labels }: Props) {
  return (
    <header className={s.topbar}>
      <div className={s.topbarLeft}>
        <span className={s.brand}>
          <strong>Evnt</strong>
          <span className={s.brandAccent}>Cue</span>
        </span>
        <span className={s.topbarSep} aria-hidden />
        <span className={s.boardName}>{labels.boardName}</span>
        <span className={s.privacyBadge} title={labels.privacyBadge}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          {labels.privacyBadge}
        </span>
      </div>
      <div className={s.topbarRight}>
        <button
          type="button"
          className={s.btnGhost}
          disabled
          title="Tidy board lands in a future chunk"
        >
          {labels.tidyBoard}
        </button>
        <button
          type="button"
          className={s.btnRender}
          disabled
          title={labels.renderDisabledTooltip}
        >
          {labels.renderButton}
          <span className={s.btnRenderPrice}>· $9.99</span>
        </button>
      </div>
    </header>
  );
}
