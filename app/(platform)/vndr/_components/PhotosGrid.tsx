"use client";

import { useRef, useState, useTransition } from "react";
import { uploadVendorPhoto } from "../_actions/upload-vendor-photo";
import { deleteVendorPhoto } from "../_actions/delete-vendor-photo";
import { reorderVendorPhotos } from "../_actions/reorder-vendor-photos";
import type { VendorPhoto } from "@/lib/vndr/profile";
import s from "../vndr.module.css";

/**
 * Vendor portfolio photo grid. Upload + delete (V-2b) + drag-drop reorder
 * (V-2c Session 3 Stream A, mig 056 backed). HTML5 native drag handlers
 * — no dnd-kit dep on this surface; mood-board already owns that library.
 * Mobile-touch drag isn't first-class via HTML5; desktop is the primary
 * surface for portfolio curation.
 *
 * On drop: optimistic local reorder, then persist via
 * reorderVendorPhotos action. If the persist fails, the next page load
 * snaps back to server state (the action revalidates /vndr/profile).
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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
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

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragOverId) setDragOverId(id);
  }

  function handleDragLeave(id: string) {
    if (id === dragOverId) setDragOverId(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    setPhotos((prev) => {
      const sourceIdx = prev.findIndex((p) => p.id === sourceId);
      const targetIdx = prev.findIndex((p) => p.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, moved);
      // Persist optimistically — failure path snaps back via revalidate.
      const orderedIds = next.map((p) => p.id);
      startTransition(async () => {
        const res = await reorderVendorPhotos({ orderedIds });
        if (!res.ok) setError(res.error);
      });
      return next.map((p, i) => ({ ...p, displayOrder: i }));
    });
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  const atCap = photos.length >= MAX_PHOTOS;

  return (
    <div>
      <div className={s.photosGrid}>
        {photos.map((p) => {
          const isDragging = draggingId === p.id;
          const isDragOver = dragOverId === p.id && draggingId !== p.id;
          return (
            <div
              key={p.id}
              className={s.photoCell}
              draggable={confirmDelete !== p.id}
              onDragStart={(e) => handleDragStart(e, p.id)}
              onDragOver={(e) => handleDragOver(e, p.id)}
              onDragLeave={() => handleDragLeave(p.id)}
              onDrop={(e) => handleDrop(e, p.id)}
              onDragEnd={handleDragEnd}
              style={{
                opacity: isDragging ? 0.45 : 1,
                outline: isDragOver ? "2px solid var(--coral)" : undefined,
                outlineOffset: isDragOver ? -2 : undefined,
                cursor: confirmDelete === p.id ? "default" : "grab",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.publicUrl}
                alt={p.altText ?? "Vendor portfolio photo"}
                className={s.photoImg}
                draggable={false}
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
          );
        })}
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
        {photos.length} of {MAX_PHOTOS} photos · drag to reorder · JPG, PNG, or WEBP up to 5 MB
      </div>
      {error && <div className={s.formErr}>{error}</div>}
    </div>
  );
}
