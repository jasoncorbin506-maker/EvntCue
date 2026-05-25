"use client";

import { useRef, useState, useTransition } from "react";
import { uploadVendorPhoto } from "../_actions/upload-vendor-photo";
import { deleteVendorPhoto } from "../_actions/delete-vendor-photo";
import type { VendorPhoto } from "@/lib/vndr/profile";
import s from "../vndr.module.css";

/**
 * V-2b Session B portfolio photo grid. Tap a thumbnail to reveal a delete
 * affordance; tap upload tile to pick a file. Max 12 photos per vendor —
 * upload tile is hidden when at cap.
 *
 * Reorder is V-2c (display_order defaults to insertion order). No image
 * cropping / framing UI in V-2b — vendor uploads pre-prepared images.
 */

const MAX_PHOTOS = 12;

type Props = {
  initial: VendorPhoto[];
};

export function PhotosGrid({ initial }: Props) {
  const [photos, setPhotos] = useState<VendorPhoto[]>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile() {
    inputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-select of same file
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const res = await uploadVendorPhoto(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPhotos((prev) => [
        ...prev,
        {
          id: res.photo.id,
          storagePath: res.photo.storagePath,
          publicUrl: res.photo.publicUrl,
          altText: null,
          displayOrder: prev.length,
        },
      ]);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteVendorPhoto(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setConfirmDelete(null);
    });
  }

  const atCap = photos.length >= MAX_PHOTOS;

  return (
    <div>
      <div className={s.photosGrid}>
        {photos.map((p) => (
          <div key={p.id} className={s.photoCell}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.publicUrl}
              alt={p.altText ?? "Vendor portfolio photo"}
              className={s.photoImg}
            />
            {confirmDelete === p.id ? (
              <div className={s.photoConfirm}>
                <button
                  type="button"
                  className={`${s.photoConfirmBtn} ${s.photoConfirmYes}`}
                  onClick={() => handleDelete(p.id)}
                  disabled={pending}
                  aria-label="Confirm delete"
                >
                  Delete
                </button>
                <button
                  type="button"
                  className={s.photoConfirmBtn}
                  onClick={() => setConfirmDelete(null)}
                  disabled={pending}
                  aria-label="Cancel delete"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={s.photoDel}
                onClick={() => setConfirmDelete(p.id)}
                aria-label="Remove photo"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {!atCap && (
          <button
            type="button"
            className={s.photoUpload}
            onClick={pickFile}
            disabled={pending}
            aria-label="Add photo"
          >
            <span className={s.photoUploadIcon}>+</span>
            <span className={s.photoUploadLbl}>
              {pending ? "Uploading…" : "Add photo"}
            </span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />
      <div className={s.photosHint}>
        {photos.length} of {MAX_PHOTOS} photos · JPG, PNG, or WEBP up to 5 MB
      </div>
      {error && <div className={s.formErr}>{error}</div>}
    </div>
  );
}
