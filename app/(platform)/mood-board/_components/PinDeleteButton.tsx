"use client";

import s from "../mood-board.module.css";

type Props = {
  pinId: string;
  label: string;
  onDelete: (pinId: string) => void;
};

/**
 * Lock 22 — the ✕ overlay on pins.
 *
 * Visibility is CSS-controlled: opacity 0 normally, opacity 1 on parent .pin
 * hover OR when parent has [data-edit-mode="true"]. Aggressive event-stopping
 * prevents the surrounding draggable from grabbing the click as a drag.
 */
export function PinDeleteButton({ pinId, label, onDelete }: Props) {
  return (
    <button
      type="button"
      className={s.pinDelete}
      onClick={(e) => {
        e.stopPropagation();
        onDelete(pinId);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={label}
      title={label}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        aria-hidden
      >
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    </button>
  );
}
