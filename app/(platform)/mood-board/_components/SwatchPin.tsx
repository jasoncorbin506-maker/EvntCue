"use client";

import { useRef } from "react";
import { useDraggable } from "@dnd-kit/react";
import { PinDeleteButton } from "./PinDeleteButton";
import s from "../mood-board.module.css";

export type SwatchPinData = {
  pinId: string;
  chipKey: string;       // for layout-state lookup
  labelEn: string;
  swatchHex: string;
  position: { x: number; y: number; rotation: number; z: number };
};

type Props = {
  pin: SwatchPinData;
  editMode?: boolean;
  onDelete?: (pinId: string) => void;
  deleteLabel?: string;
};

/**
 * Swatch pin — Material / Mood / Florals chip render. Mirrors the v3
 * mockup's swatch shape (color tile on top, name + hex below) on a
 * Polaroid frame. Sibling to PinnedImage and TypographyPin.
 */
export function SwatchPin({ pin, editMode, onDelete, deleteLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { isDragging } = useDraggable({
    id: pin.pinId,
    element: ref,
  });

  const { x, y, rotation, z } = pin.position;

  return (
    <div
      ref={ref}
      className={`${s.pin} ${s.swatchPin} ${isDragging ? s.pinDragging : ""}`}
      data-edit-mode={editMode ? "true" : undefined}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        zIndex: z,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div
        className={s.swatchTile}
        style={{ background: pin.swatchHex }}
        aria-hidden
      />
      <div className={s.swatchMeta}>
        <div className={s.swatchName}>{pin.labelEn}</div>
        <div className={s.swatchHex}>{pin.swatchHex.toUpperCase()}</div>
      </div>
      {onDelete && (
        <PinDeleteButton
          pinId={pin.pinId}
          label={deleteLabel ?? "Remove"}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
