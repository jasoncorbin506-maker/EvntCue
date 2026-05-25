"use client";

import {
  presenceInitial,
  type VendorPresence,
} from "@/lib/events/vendor-presence-shared";
import s from "./VendorPresenceDots.module.css";

type Props = {
  /** Pre-filtered presences for THIS phase (parent does the filter via
   *  presencesInPhase() so dots stay a dumb-render component). */
  presencesInPhase: VendorPresence[];
  /** Triggered when the user taps a dot — parent handles smooth-scroll +
   *  highlight pulse on the matching row in VendorsAtEventSection. */
  onDotTap?: (presenceId: string) => void;
};

const MAX_VISIBLE_DOTS = 8;

/**
 * Per-phase-group footer row of vendor presence dots — Concept C session B
 * per Cowork's v2-vertical brief Call 1.
 *
 * Each dot is a small coral circle with the vendor's initial centered in
 * white. Max 8 visible; 9+ presences → 7 dots + "+N" overflow indicator.
 * Tap a dot → callback that the parent uses to scroll to the matching
 * vendor row in VendorsAtEventSection with a brief highlight pulse.
 *
 * Renders nothing when presencesInPhase is empty — matches Cowork's spec:
 * "If no vendors present in a phase: row is not rendered at all (no empty
 * placeholder; phase group just ends at its last milestone)."
 */
export function VendorPresenceDots({ presencesInPhase, onDotTap }: Props) {
  if (presencesInPhase.length === 0) return null;

  const visibleCount =
    presencesInPhase.length <= MAX_VISIBLE_DOTS
      ? presencesInPhase.length
      : MAX_VISIBLE_DOTS - 1;
  const visiblePresences = presencesInPhase.slice(0, visibleCount);
  const overflowCount = presencesInPhase.length - visibleCount;

  return (
    <div className={s.row} aria-label={`${presencesInPhase.length} vendors present in this phase`}>
      {visiblePresences.map((presence) => (
        <button
          key={presence.id}
          type="button"
          className={s.dot}
          onClick={() => onDotTap?.(presence.id)}
          aria-label={`${presence.role_label || presence.vendor_name} — tap to view`}
        >
          {presenceInitial(presence)}
        </button>
      ))}
      {overflowCount > 0 && (
        <span className={s.overflow} aria-label={`${overflowCount} more vendors`}>
          +{overflowCount}
        </span>
      )}
    </div>
  );
}
