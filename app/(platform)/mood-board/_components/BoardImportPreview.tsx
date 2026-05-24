"use client";

import s from "../mood-board.module.css";

export type BoardImportPreviewLabels = {
  title: string;
  body: string;
  bodyCap: string;
  cancel: string;
  confirm: string;
};

type Props = {
  /** Number of free slots on this board (PER_BOARD_CAP - existing pin count). */
  remaining: number;
  labels: BoardImportPreviewLabels;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Mood Board Chunk C — board-URL confirmation modal.
 *
 * Surfaces before a board import to confirm intent. We don't show a
 * precise pin count (the Apify actor doesn't expose one without
 * spending credit + 30-60s on a wasted call), but we tell the user
 * how many of their 100 slots are free so the math is honest.
 *
 * Lock 22 warnings principle applies — this informs ("you're about
 * to import a board, not a single pin"); it doesn't block.
 */
export function BoardImportPreview({
  remaining,
  labels,
  onCancel,
  onConfirm,
}: Props) {
  const body = remaining === 100 ? labels.body : labels.bodyCap;
  return (
    <div
      className={s.modalScrim}
      role="dialog"
      aria-modal="true"
      aria-labelledby="board-import-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className={s.modalCard}>
        <h3 className={s.modalTitle} id="board-import-title">
          {labels.title}
        </h3>
        <p className={s.modalBody}>
          {body.replace("{remaining}", String(remaining))}
        </p>
        <div className={s.modalActions}>
          <button
            type="button"
            className={s.modalCancel}
            onClick={onCancel}
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            className={s.modalConfirm}
            onClick={onConfirm}
            autoFocus
          >
            {labels.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
