"use client";

import { useRef } from "react";
import s from "../mood-board.module.css";
import type { CanvasLabels } from "./MoodBoardCanvas";

type Props = {
  labels: CanvasLabels;
  onUpload: (file: File) => void;
  uploadError: string | null;
};

/**
 * Right-side drawer — "the moat" per Cowork's chip-palette research. Holds:
 *   - "Bring it in": URL paste (disabled, Chunk C unblocks) + file upload
 *   - "The palette": chip palette stub (Chunk B fills the taxonomy)
 *
 * Naming follows the v3 mockup convention. Position is RIGHT, not LEFT,
 * per the locked prototype (.main { display: flex } puts stage first, drawer
 * second). On mobile (.main flex-direction: column) the drawer drops below
 * the stage.
 */
export function Drawer({ labels, onUpload, uploadError }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // Reset the input so picking the same file twice still fires onChange.
    e.target.value = "";
  };

  return (
    <aside className={s.drawer}>
      <h3 className={s.drawerHeading}>{labels.bringItIn}</h3>
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

      <h3 className={s.drawerHeading}>{labels.palette}</h3>
      <div className={s.paletteStub}>{labels.paletteStub}</div>
    </aside>
  );
}
