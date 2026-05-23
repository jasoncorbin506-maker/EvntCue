"use client";

import { useEffect, useRef, useState } from "react";
import s from "../mood-board.module.css";
import { SLOT_ORDER, SLOTS, type SlotKey } from "@/data/moodboard/slots";
import { pollRenderJobs } from "../_actions/poll-render-jobs";

/**
 * Mood Board Chunk D — render output spread.
 *
 * 10-slot mobile-first vertical-scroll editorial layout per Lock 21.
 * Rhythm: hero (full) · 2-up · 1-up · 2-up · 1-up · 2-up · 1-up.
 *
 * Loading semantics:
 *   - succeeded → image at signed URL.
 *   - processing → loading placeholder with slot label.
 *   - failed → error placeholder with retry copy (per-slot re-roll is 3e).
 *
 * Polls every 3s via pollRenderJobs while any slot is in 'processing'
 * state. Stops polling once all slots are terminal (succeeded or failed).
 * Each poll merges the returned slot results into local state by
 * renderJobId.
 *
 * Cormorant footer caption per Lock 21 — "An inspiration, not a guarantee.
 * Built on EvntCue." (label provided by caller for i18n.)
 */

export type SlotResult =
  | {
      slot: SlotKey;
      status: "succeeded";
      renderJobId: string;
      pinId: string;
      signedUrl: string;
    }
  | {
      slot: SlotKey;
      status: "processing";
      renderJobId: string;
      providerJobId: string;
    }
  | {
      slot: SlotKey;
      status: "failed";
      renderJobId: string;
      reason: string;
    };

export type SpreadLabels = {
  /** "Your spread" — section heading above the grid. */
  spreadTitle: string;
  /** "Back to mood board" — CTA in the spread header to return to canvas. */
  spreadBackToCanvas: string;
  /** "Cue is bringing this slot to life..." — slot loading copy. */
  slotLoading: string;
  /** "We couldn't render this one." — slot failed copy. */
  slotFailed: string;
  /** Per-slot labels (override default SLOTS labels if desired). */
  slotLabels?: Partial<Record<SlotKey, string>>;
  /** Cormorant footer caption — "An inspiration, not a guarantee. Built on EvntCue." */
  footerCaption: string;
};

type Props = {
  boardId: string;
  initialSlots: SlotResult[];
  labels: SpreadLabels;
  onBackToCanvas: () => void;
};

const POLL_INTERVAL_MS = 3000;
/** Slots laid out in editorial rhythm: hero · 2-up · 1-up · 2-up · 1-up ·
 *  2-up · 1-up. Each cell here is either "hero"/"single" (full-width) or
 *  a 2-slot tuple (side-by-side on desktop, stacked on mobile). */
type SpreadRow =
  | { kind: "hero"; slot: SlotKey }
  | { kind: "single"; slot: SlotKey }
  | { kind: "pair"; slots: [SlotKey, SlotKey] };

const SPREAD_LAYOUT: SpreadRow[] = [
  { kind: "hero", slot: "hero" },
  { kind: "pair", slots: ["tablescape", "floral"] },
  { kind: "single", slot: "lighting" },
  { kind: "pair", slots: ["palette-swatch", "texture"] },
  { kind: "single", slot: "color-moment" },
  { kind: "pair", slots: ["food-plating", "ambient"] },
  { kind: "single", slot: "attire" },
];

export function RenderedSpread({
  boardId,
  initialSlots,
  labels,
  onBackToCanvas,
}: Props) {
  const [slots, setSlots] = useState<SlotResult[]>(initialSlots);
  const pollingRef = useRef(false);

  // Index by slot key for O(1) lookup during render.
  const bySlot = new Map<SlotKey, SlotResult>();
  for (const s of slots) bySlot.set(s.slot, s);

  // Polling effect — fires while any slot is 'processing'.
  useEffect(() => {
    const processingIds = slots
      .filter((s) => s.status === "processing")
      .map((s) => s.renderJobId);
    if (processingIds.length === 0) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      if (pollingRef.current) return; // skip if previous poll still in flight
      pollingRef.current = true;
      try {
        const result = await pollRenderJobs({
          boardId,
          renderJobIds: processingIds,
        });
        if (cancelled) return;
        if (result.ok) {
          setSlots((prev) => mergeSlots(prev, result.slots));
        }
      } finally {
        pollingRef.current = false;
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slots, boardId]);

  return (
    <section className={s.spreadSection} aria-label={labels.spreadTitle}>
      <header className={s.spreadHeader}>
        <h2 className={s.spreadTitle}>{labels.spreadTitle}</h2>
        <button
          type="button"
          className={s.btnGhost}
          onClick={onBackToCanvas}
        >
          {labels.spreadBackToCanvas}
        </button>
      </header>

      <div className={s.spreadGrid}>
        {SPREAD_LAYOUT.map((row, idx) => {
          if (row.kind === "hero") {
            return (
              <SpreadCell
                key={`hero-${idx}`}
                slot={row.slot}
                result={bySlot.get(row.slot)}
                labels={labels}
                hero
              />
            );
          }
          if (row.kind === "single") {
            return (
              <SpreadCell
                key={`single-${idx}`}
                slot={row.slot}
                result={bySlot.get(row.slot)}
                labels={labels}
              />
            );
          }
          // pair
          return (
            <div key={`pair-${idx}`} className={s.spreadPair}>
              <SpreadCell
                slot={row.slots[0]}
                result={bySlot.get(row.slots[0])}
                labels={labels}
              />
              <SpreadCell
                slot={row.slots[1]}
                result={bySlot.get(row.slots[1])}
                labels={labels}
              />
            </div>
          );
        })}
      </div>

      <footer className={s.spreadFooter}>
        <p className={s.spreadFooterCaption}>{labels.footerCaption}</p>
      </footer>
    </section>
  );
}

type SpreadCellProps = {
  slot: SlotKey;
  result: SlotResult | undefined;
  labels: SpreadLabels;
  hero?: boolean;
};

function SpreadCell({ slot, result, labels, hero }: SpreadCellProps) {
  const slotDef = SLOTS[slot];
  const aspectRatio = slotDef.aspectRatio;
  const slotLabel = labels.slotLabels?.[slot] ?? slotDef.labelEn;

  const aspectClass =
    aspectRatio === "16:9"
      ? s.spreadCell16x9
      : aspectRatio === "4:3"
        ? s.spreadCell4x3
        : aspectRatio === "3:4"
          ? s.spreadCell3x4
          : s.spreadCell1x1;

  // Empty (no result yet) treated same as processing for the placeholder.
  if (!result || result.status === "processing") {
    return (
      <div
        className={`${s.spreadCell} ${aspectClass} ${hero ? s.spreadCellHero : ""} ${s.spreadCellLoading}`}
        data-slot={slot}
      >
        <div className={s.spreadCellPlaceholder}>
          <div className={s.spreadCellSpinner} aria-hidden />
          <div className={s.spreadCellLabel}>{slotLabel}</div>
          <div className={s.spreadCellHint}>{labels.slotLoading}</div>
        </div>
      </div>
    );
  }

  if (result.status === "failed") {
    return (
      <div
        className={`${s.spreadCell} ${aspectClass} ${hero ? s.spreadCellHero : ""} ${s.spreadCellFailed}`}
        data-slot={slot}
        title={result.reason}
      >
        <div className={s.spreadCellPlaceholder}>
          <div className={s.spreadCellLabel}>{slotLabel}</div>
          <div className={s.spreadCellHint}>{labels.slotFailed}</div>
        </div>
      </div>
    );
  }

  // succeeded
  return (
    <div
      className={`${s.spreadCell} ${aspectClass} ${hero ? s.spreadCellHero : ""}`}
      data-slot={slot}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={result.signedUrl}
        alt={slotLabel}
        className={s.spreadCellImg}
        loading="lazy"
      />
    </div>
  );
}

/**
 * Merge polled results into the current slot state by renderJobId.
 * Newly-resolved slots win; processing slots that didn't change keep
 * their existing state.
 */
function mergeSlots(
  current: SlotResult[],
  polled: SlotResult[],
): SlotResult[] {
  const polledById = new Map(polled.map((p) => [p.renderJobId, p]));
  return current.map((c) => polledById.get(c.renderJobId) ?? c);
}
