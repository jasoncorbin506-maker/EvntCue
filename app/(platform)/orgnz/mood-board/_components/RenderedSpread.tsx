"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import s from "../mood-board.module.css";
import { SLOT_ORDER, SLOTS, type SlotKey } from "@/data/moodboard/slots";
import { pollRenderJobs } from "../_actions/poll-render-jobs";
import { rerollSlot } from "../_actions/reroll-slot";
import { generateShareToken } from "../_actions/generate-share-token";

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
  /** "Re-roll" — tap-overlay button on succeeded cells. */
  rerollButton: string;
  /** "Re-rolling..." — button text while the action is in flight. */
  rerollPending: string;
  /** "{count} left" — remaining re-rolls counter shown next to the header. */
  rerollRemaining: string;
  /** "Re-roll window closed" — surfaced when 24h elapsed. */
  rerollWindowClosed: string;
  /** "Re-roll cap reached" — surfaced when 50/board hit. */
  rerollCapReached: string;
  /** "Share" — tap-overlay button on succeeded cells. */
  shareButton: string;
  /** "Sharing…" — button text while the token mint is in flight. */
  sharePending: string;
  /** "Link copied" — fallback toast when navigator.share is unavailable. */
  shareCopied: string;
  /** "Share — {slot}" — Web Share API title template. */
  shareTitleTemplate: string;
  /** "An inspiration from our mood board…" — Web Share API text. */
  shareText: string;
};

type Props = {
  boardId: string;
  initialSlots: SlotResult[];
  /** Re-rolls remaining for this spread (50-cap minus already consumed). */
  initialRemainingReRolls: number;
  /** ISO timestamp; null if no spread has been rendered yet. */
  windowEndsAt: string | null;
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
  initialRemainingReRolls,
  windowEndsAt,
  labels,
  onBackToCanvas,
}: Props) {
  const [slots, setSlots] = useState<SlotResult[]>(initialSlots);
  const [remainingReRolls, setRemainingReRolls] = useState(initialRemainingReRolls);
  const [rerollingPinIds, setRerollingPinIds] = useState<Set<string>>(new Set());
  const [rerollError, setRerollError] = useState<string | null>(null);
  const [, startRerollTransition] = useTransition();
  const [sharingPinIds, setSharingPinIds] = useState<Set<string>>(new Set());
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [, startShareTransition] = useTransition();
  const pollingRef = useRef(false);

  const windowClosed = Boolean(
    windowEndsAt && new Date(windowEndsAt) <= new Date(),
  );
  const rerollDisabled = remainingReRolls <= 0 || windowClosed;

  // Index by slot key for O(1) lookup during render.
  const bySlot = new Map<SlotKey, SlotResult>();
  for (const s of slots) bySlot.set(s.slot, s);

  function handleReroll(pinId: string) {
    setRerollError(null);
    setRerollingPinIds((prev) => new Set(prev).add(pinId));
    startRerollTransition(async () => {
      const result = await rerollSlot({ pinId });
      setRerollingPinIds((prev) => {
        const next = new Set(prev);
        next.delete(pinId);
        return next;
      });
      if (!result.ok) {
        setRerollError(result.error);
        return;
      }
      setRemainingReRolls(result.remainingReRolls);
      // Merge the new slot result by replacing the old pin's slot entry.
      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.status !== "succeeded" || slot.pinId !== pinId) return slot;
          if (result.status === "succeeded") {
            return {
              slot: slot.slot,
              status: "succeeded",
              renderJobId: result.renderJobId,
              pinId: result.pinId,
              signedUrl: result.signedUrl,
            };
          }
          // processing — UI flips to spinner; polling effect resolves it.
          return {
            slot: slot.slot,
            status: "processing",
            renderJobId: result.renderJobId,
            providerJobId: result.providerJobId,
          };
        }),
      );
    });
  }

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

  function handleShare(pinId: string, slot: SlotKey) {
    setShareNotice(null);
    setSharingPinIds((prev) => new Set(prev).add(pinId));
    startShareTransition(async () => {
      const result = await generateShareToken({ pinId });
      setSharingPinIds((prev) => {
        const next = new Set(prev);
        next.delete(pinId);
        return next;
      });
      if (!result.ok) {
        setShareNotice(result.error);
        return;
      }
      const slotLabel = labels.slotLabels?.[slot] ?? SLOTS[slot].labelEn;
      const title = labels.shareTitleTemplate.replace("{slot}", slotLabel);
      const shareData: ShareData = {
        title,
        text: labels.shareText,
        url: result.url,
      };
      try {
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
          await navigator.share(shareData);
        } else if (
          typeof navigator !== "undefined" &&
          navigator.clipboard?.writeText
        ) {
          await navigator.clipboard.writeText(result.url);
          setShareNotice(labels.shareCopied);
        } else {
          // Last-resort: surface the URL inline so the user can copy it.
          setShareNotice(result.url);
        }
      } catch (err) {
        // User dismissed the native share sheet — not an error worth surfacing.
        if (err instanceof DOMException && err.name === "AbortError") return;
        setShareNotice(err instanceof Error ? err.message : "Share failed");
      }
    });
  }

  const renderCell = (
    slot: SlotKey,
    key: string,
    hero?: boolean,
  ) => (
    <SpreadCell
      key={key}
      slot={slot}
      result={bySlot.get(slot)}
      labels={labels}
      hero={hero}
      onReroll={handleReroll}
      rerollingPinIds={rerollingPinIds}
      rerollDisabled={rerollDisabled}
      onShare={handleShare}
      sharingPinIds={sharingPinIds}
    />
  );

  const counterText = windowClosed
    ? labels.rerollWindowClosed
    : remainingReRolls <= 0
      ? labels.rerollCapReached
      : labels.rerollRemaining.replace("{count}", String(remainingReRolls));

  return (
    <section className={s.spreadSection} aria-label={labels.spreadTitle}>
      <header className={s.spreadHeader}>
        <div className={s.spreadHeaderLeft}>
          <h2 className={s.spreadTitle}>{labels.spreadTitle}</h2>
          <span className={s.spreadRerollCounter} aria-live="polite">
            {counterText}
          </span>
        </div>
        <button
          type="button"
          className={s.btnGhost}
          onClick={onBackToCanvas}
        >
          {labels.spreadBackToCanvas}
        </button>
      </header>

      {rerollError && (
        <div className={s.spreadRerollError} role="alert">
          {rerollError}
        </div>
      )}

      {shareNotice && (
        <div className={s.spreadShareNotice} role="status">
          {shareNotice}
        </div>
      )}

      <div className={s.spreadGrid}>
        {SPREAD_LAYOUT.map((row, idx) => {
          if (row.kind === "hero") {
            return renderCell(row.slot, `hero-${idx}`, true);
          }
          if (row.kind === "single") {
            return renderCell(row.slot, `single-${idx}`);
          }
          // pair
          return (
            <div key={`pair-${idx}`} className={s.spreadPair}>
              {renderCell(row.slots[0], `pair-${idx}-a`)}
              {renderCell(row.slots[1], `pair-${idx}-b`)}
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
  onReroll: (pinId: string) => void;
  rerollingPinIds: Set<string>;
  rerollDisabled: boolean;
  onShare: (pinId: string, slot: SlotKey) => void;
  sharingPinIds: Set<string>;
};

function SpreadCell({
  slot,
  result,
  labels,
  hero,
  onReroll,
  rerollingPinIds,
  rerollDisabled,
  onShare,
  sharingPinIds,
}: SpreadCellProps) {
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
  const isRerolling = rerollingPinIds.has(result.pinId);
  const isSharing = sharingPinIds.has(result.pinId);
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
      <div className={s.spreadCellActions}>
        <button
          type="button"
          className={`${s.spreadCellAction} ${s.spreadCellShare} ${isSharing ? s.spreadCellActionPending : ""}`}
          onClick={() => onShare(result.pinId, slot)}
          disabled={isSharing}
          aria-label={labels.shareButton}
        >
          <span aria-hidden="true">↗</span>{" "}
          {isSharing ? labels.sharePending : labels.shareButton}
        </button>
        <button
          type="button"
          className={`${s.spreadCellAction} ${s.spreadCellReroll} ${isRerolling ? s.spreadCellActionPending : ""}`}
          onClick={() => onReroll(result.pinId)}
          disabled={isRerolling || rerollDisabled}
          aria-label={labels.rerollButton}
        >
          <span aria-hidden="true">⟲</span>{" "}
          {isRerolling ? labels.rerollPending : labels.rerollButton}
        </button>
      </div>
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
