"use client";

import { useEffect } from "react";
import s from "../mood-board.module.css";

type Props = {
  message: string;
  undoLabel: string;
  onUndo: () => void;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. Default 8000 per Lock 22 spec. */
  durationMs?: number;
};

/**
 * Lock 22 — bottom-center undo toast.
 *
 * Auto-dismisses after `durationMs` (default 8s). Single Undo button.
 * Dismiss does NOT restore the pin — it just clears the toast. The pin
 * stays in soft-deleted state, recoverable via the Recently Removed tray
 * for 30 days.
 */
export function UndoToast({
  message,
  undoLabel,
  onUndo,
  onDismiss,
  durationMs = 8000,
}: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div className={s.undoToast} role="status" aria-live="polite">
      <span className={s.undoToastMessage}>{message}</span>
      <button type="button" className={s.undoToastButton} onClick={onUndo}>
        {undoLabel}
      </button>
    </div>
  );
}
