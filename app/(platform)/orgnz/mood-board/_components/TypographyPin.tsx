"use client";

import { useEffect, useRef } from "react";
import { useDraggable } from "@dnd-kit/react";
import type { TypographyChip } from "@/data/moodboard/types";
import s from "../mood-board.module.css";

export type TypographyPinData = {
  pinId: string;
  chip: TypographyChip;
  /** Optional event-context overrides for the specimen text. */
  specimen?: {
    display: string;  // e.g., "Corbin Wedding"
    body: string;     // e.g., "April 17, 2027"
  };
  position: { x: number; y: number; rotation: number; z: number };
};

type Props = {
  pin: TypographyPinData;
};

/**
 * Lazy-load a Google Font <link> tag into the document head. Idempotent —
 * keyed by href so the same font isn't loaded twice across pins.
 */
function ensureFontLink(href: string): void {
  if (typeof document === "undefined") return;
  const existing = document.querySelector(`link[data-mood-font="${href}"]`);
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.moodFont = href;
  document.head.appendChild(link);
}

const DEFAULT_DISPLAY = '"Maya & Liam"';
const DEFAULT_BODY = "April 17, 2027 · Stonewall Estate";

/**
 * Typography pin — sibling to PinnedImage. Renders a display + body font
 * pairing on a Polaroid frame. Same drag + persistence infrastructure as
 * the image pin (useDraggable + parent canvas state).
 *
 * Specimen text resolution per the brief:
 *   1. chip.specimenText overrides if present
 *   2. props.specimen (derived from events.name + events.start_date) overrides default
 *   3. fall back to "Maya & Liam" / "April 17, 2027 · Stonewall Estate"
 */
export function TypographyPin({ pin }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { isDragging } = useDraggable({
    id: pin.pinId,
    element: ref,
  });

  // Lazy-load both fonts when the pin mounts.
  useEffect(() => {
    ensureFontLink(pin.chip.displayFontHref);
    ensureFontLink(pin.chip.bodyFontHref);
  }, [pin.chip.displayFontHref, pin.chip.bodyFontHref]);

  const { x, y, rotation, z } = pin.position;

  const displayText =
    pin.chip.specimenText?.display ?? pin.specimen?.display ?? DEFAULT_DISPLAY;
  const bodyText =
    pin.chip.specimenText?.body ?? pin.specimen?.body ?? DEFAULT_BODY;

  return (
    <div
      ref={ref}
      className={`${s.pin} ${s.typographyPin} ${isDragging ? s.pinDragging : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        zIndex: z,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div className={s.typographySpecimen}>
        <div
          className={s.typographyDisplay}
          style={{ fontFamily: pin.chip.displayFont }}
        >
          {displayText}
        </div>
        <div
          className={s.typographyBody}
          style={{ fontFamily: pin.chip.bodyFont }}
        >
          {bodyText}
        </div>
      </div>
      <div className={s.typographyMeta}>{pin.chip.labelEn}</div>
    </div>
  );
}
