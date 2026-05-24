import { ALL_RECIPES } from "./index";
import type { RoSRecipe, RoSItem, RoSPhase } from "./types";

/**
 * Recipe dispatcher — picks the right RoSRecipe for a given event.
 *
 * Per Cowork's index.ts §"CC's dispatch logic" + the universal-fallback
 * design (Jason's 2026-05-24 direction: "functional for everyone at launch"):
 *
 *   1. Tradition-specific match: eventType + subtype matches a recipe's
 *      eventSubtypes list.
 *   2. Generic-within-eventType: a recipe with empty eventSubtypes that
 *      matches the event_type. (None ship in V1; future generic recipes
 *      slot in here.)
 *   3. Universal fallback: the catch-all keyed `universal_fallback`. Ships
 *      with 14 items spanning all 12 phases — no event ever lands on a
 *      blank Run of Show.
 *
 * Note on universal fallback registration: it has eventType: "public_cultural"
 * + eventSubtypes: [] in Cowork's authoring. The dispatcher explicitly
 * picks it by key in step 3 instead of trusting step 2's generic match
 * to fire, because a "social" event with no recipe wouldn't otherwise
 * fall through to "public_cultural"'s generic. Option (1) from Cowork's
 * three-option discussion in index.ts.
 */

const UNIVERSAL_FALLBACK_KEY = "universal_fallback" as const;

export function pickRecipe(
  eventType: string,
  eventSubtype: string | null,
): RoSRecipe {
  // 1. Tradition-specific
  const specific = ALL_RECIPES.find(
    (r) =>
      r.eventType === eventType &&
      r.eventSubtypes.length > 0 &&
      eventSubtype != null &&
      r.eventSubtypes.includes(eventSubtype),
  );
  if (specific) return specific;

  // 2. Generic-within-eventType (none in V1; reserved for future generic
  // recipes — explicitly exclude universal_fallback so the generic case
  // doesn't fire just because universal happens to be eventType="public_
  // cultural" with empty subtypes).
  const generic = ALL_RECIPES.find(
    (r) =>
      r.eventType === eventType &&
      r.eventSubtypes.length === 0 &&
      r.key !== UNIVERSAL_FALLBACK_KEY,
  );
  if (generic) return generic;

  // 3. Universal fallback — guaranteed to exist (lives in index.ts ALL_RECIPES)
  const fallback = ALL_RECIPES.find((r) => r.key === UNIVERSAL_FALLBACK_KEY);
  if (!fallback) {
    // Defensive: if someone removes universal_fallback from ALL_RECIPES,
    // surface the bug loudly rather than rendering a blank RoS. This
    // throw becomes a Next error page — better than silent emptiness on
    // a load-bearing surface.
    throw new Error(
      "RoS dispatch: universal_fallback recipe missing from ALL_RECIPES. " +
        "This is a launch-readiness invariant — restore the recipe or " +
        "the dispatcher cannot guarantee a non-empty Run of Show.",
    );
  }
  return fallback;
}

/**
 * Phase ordering — used to render phase groups in the right sequence
 * regardless of recipe authoring order.
 */
export const PHASE_ORDER: readonly RoSPhase[] = [
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

export const PHASE_LABELS: Record<RoSPhase, string> = {
  pre_day_staging: "Day before",
  load_in: "Load-in",
  vip_arrivals: "VIP arrivals",
  guest_arrivals: "Guest arrivals",
  opening_moment: "Opening",
  first_arc: "First arc",
  transition: "Transition",
  anchor_moment: "Anchor moment",
  continuation_arc: "Continuation",
  send_off: "Send-off",
  strike: "Strike",
  day_after: "Day after",
};

/**
 * Merged Run-of-Show row — either a recipe-driven item or a user-added
 * custom milestone. Both render with the same row shape (per the brief's
 * Scope B item 4); custom rows carry the `isCustom: true` flag so the UI
 * can stamp a small "custom" text chip.
 */
export type MergedRoSRow = {
  key: string;
  phase: RoSPhase;
  time: string;
  title: string;
  vendor?: string;
  note?: string;
  isCustom: boolean;
};

export type CustomMilestoneForMerge = {
  id: string;
  label: string | null;
  custom_time: string | null;
  ros_phase: string | null;
  vendor_name: string | null;
};

/**
 * Merge recipe items + custom milestones into a per-phase ordered list.
 *
 * Per the brief (Scope B item 3):
 *   - Recipe items sorted by slot ASC within phase.
 *   - Custom items appended to phase tail.
 *   - Within the custom subset, sort by custom_time ASC (NULL last).
 *
 * Phases with zero items (recipe doesn't cover + no custom milestones)
 * collapse — the renderer skips empty phases entirely.
 */
export function mergeRecipeWithCustoms(
  recipe: RoSRecipe,
  customs: CustomMilestoneForMerge[],
): Record<RoSPhase, MergedRoSRow[]> {
  // Bucket recipe items by phase, sorted by slot.
  const byPhase: Record<RoSPhase, MergedRoSRow[]> = {
    pre_day_staging: [],
    load_in: [],
    vip_arrivals: [],
    guest_arrivals: [],
    opening_moment: [],
    first_arc: [],
    transition: [],
    anchor_moment: [],
    continuation_arc: [],
    send_off: [],
    strike: [],
    day_after: [],
  };

  const sortedRecipeItems = [...recipe.items].sort((a, b) => a.slot - b.slot);
  for (const item of sortedRecipeItems) {
    byPhase[item.phase].push({
      key: `recipe:${recipe.key}:${item.key}`,
      phase: item.phase,
      time: item.time,
      title: item.title,
      vendor: item.vendor,
      note: item.note,
      isCustom: false,
    });
  }

  // Sort customs by custom_time ASC (null last) for deterministic tail ordering.
  const sortedCustoms = customs
    .filter((c): c is CustomMilestoneForMerge & { ros_phase: RoSPhase } => {
      // Belt-and-suspenders: the SELECT already filters NOT NULL but the
      // type system doesn't carry that constraint, and the value must also
      // be one of the 12 valid phases (defensive against schema drift).
      if (c.ros_phase == null) return false;
      return (PHASE_ORDER as readonly string[]).includes(c.ros_phase);
    })
    .sort((a, b) => {
      if (a.custom_time == null && b.custom_time == null) return 0;
      if (a.custom_time == null) return 1;
      if (b.custom_time == null) return -1;
      return a.custom_time.localeCompare(b.custom_time);
    });

  for (const c of sortedCustoms) {
    byPhase[c.ros_phase].push({
      key: `custom:${c.id}`,
      phase: c.ros_phase,
      time: c.custom_time ?? "Time TBD",
      title: c.label ?? "Reserved time",
      vendor: c.vendor_name ?? undefined,
      isCustom: true,
    });
  }

  return byPhase;
}

// Re-export for convenience so RunOfShow.tsx can import everything from
// one module.
export type { RoSItem };
