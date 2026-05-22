"use client";

import { useRef } from "react";
import s from "../mood-board.module.css";
import type { CanvasLabels } from "./MoodBoardCanvas";
import type {
  ChipPalette,
  PaletteChip,
  MaterialChip,
  MoodChip,
  FloralsChip,
  TypographyChip,
  SuggestedUpload,
} from "@/data/moodboard/types";

type Props = {
  labels: CanvasLabels;
  palette: ChipPalette;
  activeFabricKey: string | null;
  onUpload: (file: File, slotTag: string | null) => void;
  onPaletteChipClick: (chip: PaletteChip) => void;
  onChipClick: (chip: MaterialChip | MoodChip | FloralsChip | TypographyChip) => void;
  uploadError: string | null;
};

/**
 * Right-side drawer — Chunk B extension. "The moat" per Cowork's
 * chip-palette research.
 *
 * Top-down:
 *   1. "Bring it in" — Suggested-shot strip (B-4) + Upload + paste-stub
 *   2. Fabric foundation — Palette chips (B-0, click → paint canvas)
 *   3. Mood / Material / Florals / Typography — pin-mode chip groups (B-1/B-2/B-3)
 *
 * Drawer position is RIGHT per the locked v3 mockup. Mobile collapses
 * to column with stage on top, drawer below.
 */
export function Drawer({
  labels,
  palette,
  activeFabricKey,
  onUpload,
  onPaletteChipClick,
  onChipClick,
  uploadError,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<string | null>(null);

  const triggerUpload = (slotTag: string | null) => {
    pendingSlotRef.current = slotTag;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file, pendingSlotRef.current);
    pendingSlotRef.current = null;
    e.target.value = "";
  };

  return (
    <aside className={s.drawer}>
      {/* ───── BRING IT IN (B-4) ───── */}
      <h3 className={s.drawerHeading}>{labels.bringItIn}</h3>

      {palette.suggestedUploads.length > 0 && (
        <div className={s.suggestedRow}>
          {palette.suggestedUploads.map((slot: SuggestedUpload) => (
            <button
              key={slot.key}
              type="button"
              className={s.suggestedChip}
              onClick={() => triggerUpload(slot.key)}
              title={`Upload a photo of: ${slot.labelEn}`}
            >
              {slot.labelEn}
            </button>
          ))}
        </div>
      )}

      <div className={s.bringRow}>
        <input
          type="text"
          className={s.bringUrlInput}
          placeholder={labels.urlPaste}
          disabled
          title={labels.urlPasteDisabled}
        />
        <button type="button" className={s.btnGhost} disabled title={labels.urlPasteDisabled}>
          Pin
        </button>
      </div>

      <label className={s.uploadButton}>
        {labels.uploadButton}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          hidden
          onChange={handleFileChange}
        />
      </label>
      <p className={s.bringItInNote}>{labels.bringItInNote}</p>
      {uploadError && (
        <p className={s.uploadError} role="alert">
          {uploadError}
        </p>
      )}

      <div className={s.drawerDivider} aria-hidden />

      {/* ───── PALETTE (B-0 fabric foundation, paint mode) ───── */}
      <h3 className={s.drawerHeading}>{labels.palette}</h3>
      <div className={s.chipGrid}>
        {palette.palette.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`${s.paletteChip} ${activeFabricKey === chip.key ? s.paletteChipActive : ""}`}
            onClick={() => onPaletteChipClick(chip)}
            title={`${chip.labelEn} · ${chip.fabricType}`}
          >
            <span
              className={s.paletteChipSwatch}
              style={{ background: chip.primaryColor }}
              aria-hidden
            />
            <span className={s.paletteChipLabel}>{chip.labelEn}</span>
          </button>
        ))}
      </div>

      <div className={s.drawerDivider} aria-hidden />

      {/* ───── MOOD ───── */}
      <h3 className={s.drawerHeading}>{labels.moodHeading}</h3>
      <div className={s.chipRow}>
        {palette.mood.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={s.chip}
            onClick={() => onChipClick(chip)}
          >
            <span
              className={s.chipDot}
              style={{ background: chip.swatchHex }}
              aria-hidden
            />
            {chip.labelEn}
          </button>
        ))}
      </div>

      {/* ───── MATERIAL ───── */}
      <h3 className={s.drawerHeading}>{labels.materialHeading}</h3>
      <div className={s.chipRow}>
        {palette.material.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={s.chip}
            onClick={() => onChipClick(chip)}
          >
            <span
              className={s.chipDot}
              style={{ background: chip.swatchHex }}
              aria-hidden
            />
            {chip.labelEn}
          </button>
        ))}
      </div>

      {/* ───── FLORALS ───── */}
      <h3 className={s.drawerHeading}>{labels.floralsHeading}</h3>
      <div className={s.chipRow}>
        {palette.florals.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={s.chip}
            onClick={() => onChipClick(chip)}
          >
            <span
              className={s.chipDot}
              style={{ background: chip.swatchHex }}
              aria-hidden
            />
            {chip.labelEn}
          </button>
        ))}
      </div>

      {/* ───── TYPOGRAPHY ───── */}
      <h3 className={s.drawerHeading}>{labels.typographyHeading}</h3>
      <div className={s.chipRow}>
        {palette.typography.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`${s.chip} ${s.chipTypography}`}
            onClick={() => onChipClick(chip)}
            title={chip.substitutesFor ? `Substitutes for ${chip.substitutesFor}` : undefined}
          >
            {chip.labelEn}
          </button>
        ))}
      </div>
    </aside>
  );
}
