"use client";

import Link from "next/link";
import s from "../mood-board.module.css";
import type { CanvasLabels } from "./MoodBoardCanvas";

type Props = {
  labels: CanvasLabels;
  editMode: boolean;
  onToggleEdit: () => void;
};

/**
 * Mood Board top bar — brand + board name + privacy badge on the left,
 * Tidy/Done + "See your event in frames · $9.99" CTA on the right.
 *
 * Lock 22 — Tidy is no longer a stub. Tapping it toggles edit mode on the
 * canvas, surfacing persistent ✕ icons on every pin + a Straighten all
 * action + a Recently Removed entry point. Label flips to "Done" while
 * edit mode is active.
 *
 * Render button remains stubbed-disabled until Chunk D wires the Flux
 * 2 Pro render flow + Stripe one-time charge.
 */
export function TopBar({ labels, editMode, onToggleEdit }: Props) {
  return (
    <header className={s.topbar}>
      <div className={s.topbarLeft}>
        <Link href="/orgnz" className={s.backLink} aria-label={labels.backToDashboard}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>{labels.backToDashboard}</span>
        </Link>
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
          className={`${s.btnGhost} ${editMode ? s.btnGhostActive : ""}`}
          onClick={onToggleEdit}
          aria-pressed={editMode}
        >
          {editMode ? labels.editDone : labels.tidyBoard}
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
