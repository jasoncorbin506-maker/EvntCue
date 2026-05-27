"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveVenueSpace } from "../../../_actions/archive-venue-space";
import type { VenueSpace } from "@/lib/venu/availability-shared";
import s from "./SpaceRow.module.css";

type Props = {
  space: VenueSpace;
  onEdit: () => void;
};

function fmtDollarsFromCents(cents: number): string {
  if (cents <= 0) return "—";
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString()}`
    : `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SpaceRow({ space, onEdit }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleArchive() {
    setError(null);
    if (!confirm(`Archive "${space.name}"? It'll stop showing on inquiries until you reactivate.`)) {
      return;
    }
    startTransition(async () => {
      const res = await archiveVenueSpace(space.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const statusClass =
    space.status === "active"
      ? s.statusActive
      : space.status === "seasonal"
        ? s.statusSeasonal
        : s.statusInactive;
  const statusLabel =
    space.status === "active" ? "Active" : space.status === "seasonal" ? "Seasonal" : "Archived";

  return (
    <div className={s.row}>
      <div className={s.head}>
        <div className={s.nameWrap}>
          <span className={s.name}>{space.name}</span>
          <span className={`${s.statusPill} ${statusClass}`}>{statusLabel}</span>
        </div>
      </div>

      <div className={s.facts}>
        {space.capacity !== null && (
          <span className={s.fact}>{space.capacity} guests</span>
        )}
        {space.ratePerDayCents > 0 && (
          <span className={s.fact}>{fmtDollarsFromCents(space.ratePerDayCents)}/day</span>
        )}
        {space.sqFt !== null && space.sqFt > 0 && (
          <span className={s.fact}>{space.sqFt.toLocaleString()} sq ft</span>
        )}
      </div>

      {space.description && <div className={s.desc}>{space.description}</div>}

      {error && <div className={s.error}>{error}</div>}

      <div className={s.actions}>
        <button
          type="button"
          className={s.actionBtn}
          onClick={onEdit}
          disabled={pending}
        >
          Edit
        </button>
        {space.status !== "inactive" && (
          <button
            type="button"
            className={`${s.actionBtn} ${s.danger}`}
            onClick={handleArchive}
            disabled={pending}
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
