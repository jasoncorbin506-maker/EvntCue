/**
 * Per-event-type Run-of-Show phase labels.
 *
 * The 12 universal phases (data/ros-phases.ts) carry abstract names that
 * must cover wedding + corporate + nonprofit + everything. When the user
 * is planning a wedding, "Opening" reads as a placeholder; "Ceremony" is
 * what they're actually thinking about. Same pattern for corporate
 * ("Keynote" not "Anchor moment") and nonprofit ("The ask" not "Anchor
 * moment").
 *
 * Per Jason's session 18x smoke ("the language inside of those pills should
 * reflect the sub category language"): wedding events display wedding-
 * flavored labels on the chip picker + RoS phase headers; corporate +
 * nonprofit get their own; social + public_cultural fall back to universal
 * (varied sub-types within those categories — no single dominant flavor
 * yet, would mislead users).
 *
 * Hook for per-recipe deeper precision (e.g., Catholic wedding's
 * anchor_moment is "Nuptial Mass" vs Protestant's "Vows + first dance" vs
 * Hindu's "Saptapadi") is in types.ts via the RoSRecipe.phaseLabels field
 * — Cowork populates per recipe in their next session.
 *
 * Lookup precedence (highest to lowest):
 *   1. recipe.phaseLabels[phase] — per-recipe override (Cowork pass)
 *   2. PHASE_LABELS_BY_EVENT_TYPE[eventType][phase] — this file
 *   3. PHASE_LABELS[phase] — universal default from dispatch.ts
 */

import type { RoSPhase } from "./types";
import { PHASE_LABELS } from "./dispatch";

const WEDDING: Partial<Record<RoSPhase, string>> = {
  pre_day_staging: "Rehearsal / D-1",
  load_in: "Load-in",
  vip_arrivals: "Wedding party arrives",
  guest_arrivals: "Guests seated",
  opening_moment: "Ceremony",
  first_arc: "Cocktail hour",
  transition: "Reception begins",
  anchor_moment: "Vows + first dance",
  continuation_arc: "Dancing + speeches",
  send_off: "Send-off",
  strike: "Strike",
  day_after: "Day after",
};

const CORPORATE: Partial<Record<RoSPhase, string>> = {
  pre_day_staging: "Pre-event setup",
  load_in: "Load-in + AV",
  vip_arrivals: "Sponsors + speakers arrive",
  guest_arrivals: "Doors open",
  opening_moment: "Welcome / kickoff",
  first_arc: "First program block",
  transition: "Break / networking",
  anchor_moment: "Keynote",
  continuation_arc: "Closing program",
  send_off: "Wrap-up",
  strike: "Breakdown",
  day_after: "Day after",
};

const NONPROFIT: Partial<Record<RoSPhase, string>> = {
  pre_day_staging: "Pre-event setup",
  load_in: "Load-in",
  vip_arrivals: "Honoree + leadership arrive",
  guest_arrivals: "Doors open",
  opening_moment: "Welcome",
  first_arc: "Dinner + program",
  transition: "Transition",
  anchor_moment: "The ask",
  continuation_arc: "Closing program",
  send_off: "Wrap-up",
  strike: "Strike",
  day_after: "Day after",
};

const PHASE_LABELS_BY_EVENT_TYPE: Record<string, Partial<Record<RoSPhase, string>>> = {
  wedding: WEDDING,
  corporate: CORPORATE,
  nonprofit: NONPROFIT,
  // social + public_cultural fall through to PHASE_LABELS universal defaults.
};

/**
 * Resolve the display label for a phase given the event type.
 * Falls back to the universal label (PHASE_LABELS) if no event-type override.
 *
 * eventType is the raw value from events.event_type (matches CategoryKey from
 * data/budget-presets.ts). NULL safe — null/unknown event types get universal.
 */
export function phaseLabel(
  eventType: string | null | undefined,
  phase: RoSPhase,
): string {
  if (eventType) {
    const override = PHASE_LABELS_BY_EVENT_TYPE[eventType]?.[phase];
    if (override) return override;
  }
  return PHASE_LABELS[phase];
}
