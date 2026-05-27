"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertVenueSpace } from "../../../_actions/upsert-venue-space";
import type {
  VenueSpace,
  VenueSpaceStatus,
} from "@/lib/venu/availability-shared";
import s from "./SpaceSheet.module.css";

/**
 * Create/edit sheet for a single venue_space. Mirrors the bottom-drawer
 * pattern used elsewhere in the venu portal (AvailabilityBlockSheet,
 * SubscribeCalendarFeedSheet).
 */
type Props = {
  /** null = create mode; non-null = edit mode for that space */
  space: VenueSpace | null;
  onClose: () => void;
};

function dollarsToCents(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export function SpaceSheet({ space, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const editMode = space !== null;

  const [name, setName] = useState(space?.name ?? "");
  const [capacityStr, setCapacityStr] = useState(
    space?.capacity !== null && space?.capacity !== undefined
      ? String(space.capacity)
      : "",
  );
  const [rateStr, setRateStr] = useState(
    space && space.ratePerDayCents > 0 ? (space.ratePerDayCents / 100).toString() : "",
  );
  const [sqFtStr, setSqFtStr] = useState(
    space?.sqFt !== null && space?.sqFt !== undefined ? String(space.sqFt) : "",
  );
  const [description, setDescription] = useState(space?.description ?? "");
  const [status, setStatus] = useState<VenueSpaceStatus>(space?.status ?? "active");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give the space a name.");
      return;
    }

    let capacity: number | null = null;
    if (capacityStr.trim()) {
      const c = Number(capacityStr);
      if (!Number.isFinite(c) || c < 0) {
        setError("Capacity must be a non-negative number.");
        return;
      }
      capacity = Math.round(c);
    }

    const ratePerDayCents = dollarsToCents(rateStr);
    if (ratePerDayCents === null) {
      setError("Rate must be a non-negative number.");
      return;
    }

    let sqFt: number | null = null;
    if (sqFtStr.trim()) {
      const f = Number(sqFtStr);
      if (!Number.isFinite(f) || f < 0) {
        setError("Square footage must be a non-negative number.");
        return;
      }
      sqFt = Math.round(f);
    }

    startTransition(async () => {
      const res = await upsertVenueSpace({
        id: space?.id,
        name: trimmedName,
        capacity,
        ratePerDayCents,
        description: description.trim() || null,
        sqFt,
        status,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label={editMode ? "Edit space" : "Add space"}>
        <div className={s.header}>
          <div>
            <div className={s.title}>{editMode ? "Edit space" : "Add a space"}</div>
            <div className={s.subtitle}>
              {editMode
                ? "Update the room or hall details."
                : "Add a new room, hall, or outdoor area to your venue."}
            </div>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={s.fieldRow}>
          <label className={s.fieldLbl} htmlFor="sp-name">Name</label>
          <input
            id="sp-name"
            type="text"
            className={s.input}
            placeholder="e.g., Main Ballroom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </div>

        <div className={s.fieldGrid}>
          <div className={s.fieldRow}>
            <label className={s.fieldLbl} htmlFor="sp-capacity">Capacity</label>
            <input
              id="sp-capacity"
              type="number"
              inputMode="numeric"
              className={s.input}
              placeholder="guests"
              value={capacityStr}
              onChange={(e) => setCapacityStr(e.target.value)}
              min={0}
            />
          </div>
          <div className={s.fieldRow}>
            <label className={s.fieldLbl} htmlFor="sp-rate">Rate / day</label>
            <div className={s.inputPrefixWrap}>
              <span className={s.inputPrefix}>$</span>
              <input
                id="sp-rate"
                type="number"
                inputMode="decimal"
                className={`${s.input} ${s.inputWithPrefix}`}
                placeholder="0"
                value={rateStr}
                onChange={(e) => setRateStr(e.target.value)}
                min={0}
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className={s.fieldRow}>
          <label className={s.fieldLbl} htmlFor="sp-sqft">Square footage <span className={s.optional}>(optional)</span></label>
          <input
            id="sp-sqft"
            type="number"
            inputMode="numeric"
            className={s.input}
            placeholder="sq ft"
            value={sqFtStr}
            onChange={(e) => setSqFtStr(e.target.value)}
            min={0}
          />
        </div>

        <div className={s.fieldRow}>
          <label className={s.fieldLbl} htmlFor="sp-desc">Description <span className={s.optional}>(optional)</span></label>
          <textarea
            id="sp-desc"
            className={s.textarea}
            placeholder="What's unique about this space — view, layout, vibe..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className={s.fieldRow}>
          <label className={s.fieldLbl} htmlFor="sp-status">Status</label>
          <select
            id="sp-status"
            className={s.input}
            value={status}
            onChange={(e) => setStatus(e.target.value as VenueSpaceStatus)}
          >
            <option value="active">Active — bookable</option>
            <option value="seasonal">Seasonal — bookable in season</option>
            <option value="inactive">Archived — hidden from inquiries</option>
          </select>
        </div>

        {error && <div className={s.errMsg}>{error}</div>}

        <div className={s.footer}>
          <button type="button" className={s.btn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={handleSubmit}
            disabled={pending}
          >
            {pending ? "Saving…" : editMode ? "Save changes" : "Add space"}
          </button>
        </div>
      </div>
    </>
  );
}
