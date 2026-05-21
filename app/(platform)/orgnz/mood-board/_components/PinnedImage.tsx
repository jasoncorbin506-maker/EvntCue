"use client";

import { useRef } from "react";
import { useDraggable } from "@dnd-kit/react";
import type { LoadedPin } from "../_lib/load-board";
import s from "../mood-board.module.css";

type Props = {
  pin: LoadedPin;
};

/**
 * Single Polaroid pin on the corkboard.
 *
 * Rendering:
 *   - Wrapper div is absolutely positioned within the .board parent via
 *     left/top inline styles, then rotated via transform.
 *   - During drag, useDraggable returns an `isDragging` flag + a transform
 *     that the @dnd-kit/dom library applies to the element automatically.
 *   - On drop, the parent canvas computes the new (x, y) from the drag
 *     transform delta and re-renders us at the new position.
 *
 * Polaroid styling (per the locked v3 mockup): white frame, 12px top/sides,
 * 36px bottom, drop shadow, slight rotation per pin's `position.rotation`.
 */
export function PinnedImage({ pin }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { isDragging } = useDraggable({
    id: pin.id,
    element: ref,
  });

  const { x, y, rotation, z } = pin.position;

  return (
    <div
      ref={ref}
      className={`${s.pin} ${isDragging ? s.pinDragging : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        zIndex: z,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <img
        src={pin.signed_url}
        alt=""
        className={s.pinImg}
        draggable={false}
      />
    </div>
  );
}
