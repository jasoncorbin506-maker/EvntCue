"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  listRecentlyDeletedPinsAction,
  type RecentlyDeletedPin,
} from "../_actions/list-recently-deleted-pins";
import s from "../mood-board.module.css";

export type RecentlyRemovedLabels = {
  title: string;
  empty: string;
  restore: string;
  close: string;
  loading: string;
  windowNote: string;
};

type Props = {
  boardId: string;
  labels: RecentlyRemovedLabels;
  /** Resolve a chipKey → preview shape for chip-source pins. */
  resolveChipPreview: (chipKey: string) => { kind: "swatch"; hex: string; label: string } | { kind: "typography"; label: string } | null;
  onRestore: (pin: RecentlyDeletedPin) => Promise<void> | void;
  onClose: () => void;
};

/**
 * Lock 22 — Recently Removed tray.
 *
 * Lists soft-deleted pins from the last 30 days with Restore buttons. Loads
 * on mount + re-fetches after every restore (the parent calls back into
 * this drawer's reload via the `key` prop trick, or via the onRestore
 * promise resolving before we refresh local state — chosen here:
 * the drawer manages its own list state and refetches after restore).
 *
 * v1 minimal surface — slides in from the right, dismissable. Polish-pass
 * sweep (animations, grouping by day, multi-select) tied to Chunk D.
 */
export function RecentlyRemovedDrawer({
  boardId,
  labels,
  resolveChipPreview,
  onRestore,
  onClose,
}: Props) {
  const [pins, setPins] = useState<RecentlyDeletedPin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startRestore] = useTransition();

  const reload = useCallback(async () => {
    const result = await listRecentlyDeletedPinsAction({ boardId });
    if (!result.ok) {
      setError(result.error);
      setPins([]);
      return;
    }
    setError(null);
    setPins(result.pins);
  }, [boardId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleRestore = useCallback(
    (pin: RecentlyDeletedPin) => {
      startRestore(async () => {
        await onRestore(pin);
        await reload();
      });
    },
    [onRestore, reload],
  );

  return (
    <aside className={s.recentDrawer} aria-label={labels.title}>
      <header className={s.recentDrawerHeader}>
        <div className={s.recentDrawerTitle}>{labels.title}</div>
        <button
          type="button"
          className={s.recentDrawerClose}
          onClick={onClose}
          aria-label={labels.close}
        >
          ×
        </button>
      </header>
      <div className={s.recentDrawerNote}>{labels.windowNote}</div>
      <div className={s.recentDrawerList}>
        {pins === null && <div className={s.recentDrawerEmpty}>{labels.loading}</div>}
        {pins !== null && pins.length === 0 && (
          <div className={s.recentDrawerEmpty}>{error ?? labels.empty}</div>
        )}
        {pins !== null &&
          pins.map((pin) => {
            const chipKey = chipKeyFromDeletedPin(pin);
            const preview = chipKey ? resolveChipPreview(chipKey) : null;
            return (
              <div key={pin.id} className={s.recentDrawerItem}>
                <div className={s.recentDrawerPreview}>
                  {pin.signed_url && (
                    <img
                      src={pin.signed_url}
                      alt=""
                      className={s.recentDrawerThumb}
                    />
                  )}
                  {preview?.kind === "swatch" && (
                    <span
                      className={s.recentDrawerSwatch}
                      style={{ background: preview.hex }}
                      aria-hidden
                    />
                  )}
                  {preview?.kind === "typography" && (
                    <span className={s.recentDrawerTypeBadge}>Aa</span>
                  )}
                </div>
                <div className={s.recentDrawerMeta}>
                  <div className={s.recentDrawerLabel}>
                    {preview?.kind === "swatch" || preview?.kind === "typography"
                      ? preview.label
                      : pin.tags.find((t) => !t.startsWith("chip:")) ?? "Image"}
                  </div>
                  <div className={s.recentDrawerWhen}>
                    {formatRelative(pin.deleted_at)}
                  </div>
                </div>
                <button
                  type="button"
                  className={s.recentDrawerRestore}
                  onClick={() => handleRestore(pin)}
                >
                  {labels.restore}
                </button>
              </div>
            );
          })}
      </div>
    </aside>
  );
}

function chipKeyFromDeletedPin(pin: RecentlyDeletedPin): string | null {
  if (pin.image_path.startsWith("chip://")) {
    return pin.image_path.slice("chip://".length);
  }
  const tagged = pin.tags.find((t) => t.startsWith("chip:"));
  return tagged ? tagged.slice("chip:".length) : null;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
