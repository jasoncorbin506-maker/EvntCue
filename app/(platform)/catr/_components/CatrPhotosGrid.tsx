"use client";

import { useRef, useState, useTransition } from "react";
import { uploadCatrPhoto } from "../_actions/upload-catr-photo";
import { deleteCatrPhoto } from "../_actions/delete-catr-photo";
import type { CatrPhoto } from "@/lib/catr/photos";
import s from "./CatrPhotosGrid.module.css";

/**
 * Caterer portfolio photo grid (Lock 30 catr tail). Lean upload + delete,
 * mirrors VenuePhotosGrid. Rendered inline inside the profile editor (no
 * separate route). First photo is the marketplace cover.
 */

const MAX_PHOTOS = 12;

type Props = { initial: CatrPhoto[] };

export function CatrPhotosGrid({ initial }: Props) {
  const [photos, setPhotos] = useState<CatrPhoto[]>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const atCap = photos.length >= MAX_PHOTOS;

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await uploadCatrPhoto(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPhotos((prev) => [
        ...prev,
        { id: res.photo.id, storagePath: res.photo.storagePath, url: res.photo.publicUrl, altText: null, displayOrder: prev.length },
      ]);
    });
  }

  function onDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteCatrPhoto(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setConfirmDelete(null);
    });
  }

  return (
    <div className={s.wrap}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={s.hiddenInput}
        onChange={handleFileSelected}
      />

      {error && <div className={s.error}>{error}</div>}

      <div className={s.grid}>
        {photos.map((p, i) => (
          <div key={p.id} className={s.cell}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.altText ?? "Catering photo"} className={s.img} loading="lazy" />
            {i === 0 && <span className={s.coverTag}>Cover</span>}
            {confirmDelete === p.id ? (
              <div className={s.confirm}>
                <button type="button" className={s.confirmYes} onClick={() => onDelete(p.id)} disabled={pending}>
                  Remove
                </button>
                <button type="button" className={s.confirmNo} onClick={() => setConfirmDelete(null)} disabled={pending}>
                  Keep
                </button>
              </div>
            ) : (
              <button type="button" className={s.del} onClick={() => setConfirmDelete(p.id)} aria-label="Remove photo">
                ×
              </button>
            )}
          </div>
        ))}

        {!atCap && (
          <button type="button" className={s.addCell} onClick={() => inputRef.current?.click()} disabled={pending}>
            <span className={s.addPlus}>+</span>
            <span className={s.addLabel}>{pending ? "Uploading…" : "Add photo"}</span>
          </button>
        )}
      </div>

      <p className={s.hint}>
        Up to {MAX_PHOTOS} photos · JPEG, PNG, or WEBP · 5 MB each. The first is your
        marketplace cover. These show on your public profile once you publish.
      </p>
    </div>
  );
}
