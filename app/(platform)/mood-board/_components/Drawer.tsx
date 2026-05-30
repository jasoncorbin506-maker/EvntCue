"use client";

import { useRef, useState } from "react";
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
import { classifyPinterestUrl } from "../_lib/pinterest-url";

export type ImportStatus =
  | { state: "idle" }
  | { state: "loading"; message: string }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type Props = {
  labels: CanvasLabels;
  palette: ChipPalette;
  activeFabricKey: string | null;
  /** Per-chip count of pins currently on the board (keyed by chip.key). Drives
   *  the "added" feedback on the drop-chip rows. */
  chipPinCounts: Record<string, number>;
  onUpload: (file: File, slotTag: string | null) => void;
  onPaletteChipClick: (chip: PaletteChip) => void;
  onChipClick: (chip: MaterialChip | MoodChip | FloralsChip | TypographyChip) => void;
  onUrlSubmit: (url: string) => void;
  importStatus: ImportStatus;
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
  chipPinCounts,
  onUpload,
  onPaletteChipClick,
  onChipClick,
  onUrlSubmit,
  importStatus,
  uploadError,
}: Props) {
  // "{count} on your board" — fill the i18n placeholder client-side.
  const onBoardLabel = (count: number) =>
    labels.chipOnBoard.replace("{count}", String(count));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<string | null>(null);
  const [urlValue, setUrlValue] = useState("");
  const [inlineUrlError, setInlineUrlError] = useState<string | null>(null);

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

  const handleUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = urlValue.trim();
    if (!url) return;
    const kind = classifyPinterestUrl(url);
    if (kind === "invalid") {
      setInlineUrlError(labels.urlImportInvalid);
      return;
    }
    setInlineUrlError(null);
    onUrlSubmit(url);
    // Clear the field on submit — parent owns success/error state in importStatus.
    setUrlValue("");
  };

  const isImporting = importStatus.state === "loading";

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

      <form className={s.bringRow} onSubmit={handleUrlSubmit}>
        <input
          type="url"
          className={s.bringUrlInput}
          placeholder={labels.urlPaste}
          value={urlValue}
          onChange={(e) => {
            setUrlValue(e.target.value);
            if (inlineUrlError) setInlineUrlError(null);
          }}
          disabled={isImporting}
          aria-invalid={inlineUrlError ? "true" : "false"}
        />
        <button
          type="submit"
          className={s.btnGhost}
          disabled={isImporting || urlValue.trim().length === 0}
        >
          {labels.urlImportButton}
        </button>
      </form>
      <p className={s.urlImportSubtitle}>{labels.urlImportSubtitle}</p>
      {inlineUrlError && (
        <p className={s.urlImportInline} role="alert">
          {inlineUrlError}
        </p>
      )}
      {importStatus.state === "loading" && (
        <p className={s.urlImportStatus} role="status">
          {importStatus.message}
        </p>
      )}
      {importStatus.state === "success" && (
        <p className={s.urlImportSuccess} role="status">
          {importStatus.message}
        </p>
      )}
      {importStatus.state === "error" && (
        <p className={s.uploadError} role="alert">
          {importStatus.message}
        </p>
      )}

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
            {activeFabricKey === chip.key && (
              <span className={s.paletteChipSelectedTag}>{`✓ ${labels.selected}`}</span>
            )}
          </button>
        ))}
      </div>

      <div className={s.drawerDivider} aria-hidden />

      {/* ───── MOOD ───── */}
      <h3 className={s.drawerHeading}>{labels.moodHeading}</h3>
      <div className={s.chipRow}>
        {palette.mood.map((chip) => {
          const count = chipPinCounts[chip.key] ?? 0;
          return (
            <button
              key={chip.key}
              type="button"
              className={`${s.chip} ${count > 0 ? s.chipActive : ""}`.trim()}
              onClick={() => onChipClick(chip)}
              aria-label={count > 0 ? `${chip.labelEn} — ${onBoardLabel(count)}` : undefined}
            >
              <span
                className={s.chipDot}
                style={{ background: chip.swatchHex }}
                aria-hidden
              />
              {chip.labelEn}
              {count > 0 && (
                <span className={s.chipCount} aria-hidden>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ───── MATERIAL ───── */}
      <h3 className={s.drawerHeading}>{labels.materialHeading}</h3>
      <div className={s.chipRow}>
        {palette.material.map((chip) => {
          const count = chipPinCounts[chip.key] ?? 0;
          return (
            <button
              key={chip.key}
              type="button"
              className={`${s.chip} ${count > 0 ? s.chipActive : ""}`.trim()}
              onClick={() => onChipClick(chip)}
              aria-label={count > 0 ? `${chip.labelEn} — ${onBoardLabel(count)}` : undefined}
            >
              <span
                className={s.chipDot}
                style={{ background: chip.swatchHex }}
                aria-hidden
              />
              {chip.labelEn}
              {count > 0 && (
                <span className={s.chipCount} aria-hidden>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ───── FLORALS ───── */}
      <h3 className={s.drawerHeading}>{labels.floralsHeading}</h3>
      <div className={s.chipRow}>
        {palette.florals.map((chip) => {
          const count = chipPinCounts[chip.key] ?? 0;
          return (
            <button
              key={chip.key}
              type="button"
              className={`${s.chip} ${count > 0 ? s.chipActive : ""}`.trim()}
              onClick={() => onChipClick(chip)}
              aria-label={count > 0 ? `${chip.labelEn} — ${onBoardLabel(count)}` : undefined}
            >
              <span
                className={s.chipDot}
                style={{ background: chip.swatchHex }}
                aria-hidden
              />
              {chip.labelEn}
              {count > 0 && (
                <span className={s.chipCount} aria-hidden>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ───── TYPOGRAPHY ───── */}
      <h3 className={s.drawerHeading}>{labels.typographyHeading}</h3>
      <div className={s.chipRow}>
        {palette.typography.map((chip) => {
          const count = chipPinCounts[chip.key] ?? 0;
          return (
            <button
              key={chip.key}
              type="button"
              className={`${s.chip} ${s.chipTypography} ${count > 0 ? s.chipActive : ""}`.trim()}
              onClick={() => onChipClick(chip)}
              title={chip.substitutesFor ? `Substitutes for ${chip.substitutesFor}` : undefined}
              aria-label={count > 0 ? `${chip.labelEn} — ${onBoardLabel(count)}` : undefined}
            >
              {chip.labelEn}
              {count > 0 && (
                <span className={s.chipCount} aria-hidden>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
