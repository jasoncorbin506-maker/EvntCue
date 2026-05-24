/**
 * Run of Show — 12 universal phases.
 *
 * Single source of truth for the day-of phase skeleton per
 * ~/Desktop/Backstage/product/run-of-show/README.md §"The universal skeleton".
 * Consumed by:
 *   - The custom-milestone popup's "where in the day?" chip picker
 *     (app/(platform)/orgnz/_components/CustomMilestoneForm.tsx)
 *   - Migration 048's CHECK constraint on event_custom_milestones.ros_phase
 *     (the literal phase strings must match the constraint exactly)
 *   - The future RunOfShow read path (after Cowork delivers structured
 *     recipes per inbox-cc/2026-05-24-recipe-library-structured-format-
 *     request.md). Recipe items + custom milestones merge into this
 *     ordered phase sequence at render time.
 *
 * Phase keys are stable forever. Display labels can evolve through
 * lib/labels/ in a later i18n pass (deferred per Phase 3.3 per-portal
 * convention — hardcoded EN here matches the rest of CustomMilestoneForm).
 */

export const ROS_PHASE_KEYS = [
  "pre_day_staging",
  "load_in",
  "vip_arrivals",
  "guest_arrivals",
  "opening_moment",
  "first_arc",
  "transition",
  "anchor_moment",
  "continuation_arc",
  "send_off",
  "strike",
  "day_after",
] as const;

export type RoSPhaseKey = (typeof ROS_PHASE_KEYS)[number];

export type RoSPhaseEntry = {
  key: RoSPhaseKey;
  labelEn: string;
  /** One-line context shown on hover/long-press to disambiguate similar phases. */
  hintEn: string;
};

export const ROS_PHASES: readonly RoSPhaseEntry[] = [
  {
    key: "pre_day_staging",
    labelEn: "D-1 setup",
    hintEn: "Day before — rentals, rehearsal, pre-positioning",
  },
  {
    key: "load_in",
    labelEn: "Load-in",
    hintEn: "Vendors arriving on-site",
  },
  {
    key: "vip_arrivals",
    labelEn: "VIP arrivals",
    hintEn: "Honoree, family, wedding party in place",
  },
  {
    key: "guest_arrivals",
    labelEn: "Guest arrivals",
    hintEn: "Doors open, greeters in place",
  },
  {
    key: "opening_moment",
    labelEn: "Opening",
    hintEn: "Processional, welcome, formal start",
  },
  {
    key: "first_arc",
    labelEn: "First arc",
    hintEn: "First half of meaningful content",
  },
  {
    key: "transition",
    labelEn: "Transition",
    hintEn: "Meal, interlude, breath between content blocks",
  },
  {
    key: "anchor_moment",
    labelEn: "Anchor moment",
    hintEn: "The one thing the day exists to do",
  },
  {
    key: "continuation_arc",
    labelEn: "Continuation",
    hintEn: "Dancing, speeches, second-half content",
  },
  {
    key: "send_off",
    labelEn: "Send-off",
    hintEn: "Honoree exits, formal close",
  },
  {
    key: "strike",
    labelEn: "Strike",
    hintEn: "Vendor breakdown",
  },
  {
    key: "day_after",
    labelEn: "Day after",
    hintEn: "Rental returns, vendor thank-yous, asset handoff",
  },
] as const;

export function isRoSPhaseKey(value: unknown): value is RoSPhaseKey {
  return (
    typeof value === "string" &&
    (ROS_PHASE_KEYS as readonly string[]).includes(value)
  );
}

export function rosPhaseLabel(key: RoSPhaseKey | null): string {
  if (key === null) return "Planning only";
  return ROS_PHASES.find((p) => p.key === key)?.labelEn ?? key;
}
