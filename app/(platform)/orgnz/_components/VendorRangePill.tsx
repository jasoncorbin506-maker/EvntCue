import { PHASE_ORDER, PHASE_LABELS } from "@/data/run-of-show/dispatch";
import type { RoSPhase } from "@/data/run-of-show/types";
import s from "./VendorRangePill.module.css";

type Props = {
  phases: RoSPhase[];
};

/**
 * 12-segment horizontal coverage indicator — Concept C session B per
 * Cowork's v2-vertical brief Call 1.
 *
 * Each segment represents one of the 12 universal RoS phases (in
 * PHASE_ORDER). Segments where the vendor IS present render in coral at
 * full opacity; absent segments render in faint gray. The visual
 * immediately communicates "how present is this vendor" — a venue
 * coordinator covering all 12 phases shows a solid coral bar; an
 * officiant in 1 phase shows 1 coral dot + 11 gray.
 *
 * Pair with screen-reader text for a11y per Cowork's hard constraint.
 */
export function VendorRangePill({ phases }: Props) {
  const presentSet = new Set<RoSPhase>(phases);
  const presentPhaseLabels = PHASE_ORDER.filter((p) => presentSet.has(p))
    .map((p) => PHASE_LABELS[p])
    .join(", ");

  return (
    <div className={s.pill} role="img" aria-label={`Present in ${phases.length} of 12 phases: ${presentPhaseLabels}`}>
      {PHASE_ORDER.map((phase) => (
        <span
          key={phase}
          className={`${s.segment} ${presentSet.has(phase) ? s.segmentOn : ""}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
