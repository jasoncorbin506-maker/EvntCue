// data/run-of-show/types.ts
//
// Run of Show recipe shape — locked per CC's request brief
// (outbox-cc/2026-05-24-recipe-library-structured-format-request.md).
//
// CC's app repo location: ~/Desktop/evntcue/04_evntcue_Site_Live/data/run-of-show/types.ts
// Cowork-side authoring location: ~/Desktop/Backstage/product/run-of-show/_structured/types.ts
//
// CC mirrors this file into the app repo on read; the prose recipes at
// product/run-of-show/{cultural,corporate,nonprofit}/*.md remain the
// canonical source — these structured files are the machine-readable twin.

/** The 12 universal phases per product/run-of-show/README.md.
 *  Every Run of Show, regardless of cultural or corporate origin, moves
 *  through these phases. Recipes dress them differently; the bones are
 *  the same. */
export type RoSPhase =
  | "pre_day_staging"
  | "load_in"
  | "vip_arrivals"
  | "guest_arrivals"
  | "opening_moment"
  | "first_arc"
  | "transition"
  | "anchor_moment"
  | "continuation_arc"
  | "send_off"
  | "strike"
  | "day_after";

export type RoSItem = {
  /** Stable key, unique within the recipe. snake_case. Used for React keys
   *  and as the i18n namespace if/when translations land. Once shipped,
   *  never changes — i18n + analytics + future override-by-key features
   *  all depend on key stability. */
  key: string;

  /** Which of the 12 phases this item belongs to. */
  phase: RoSPhase;

  /** Order within the phase (1-indexed by convention, but in practice
   *  authored at 10, 20, 30… so future insertions don't require
   *  renumbering). Lower numbers render first. */
  slot: number;

  /** Display time. Two valid formats per CC's spec:
   *  - Anchor-relative ("ceremony − 90 min", "vows + 45 min", "saptapadi − 60 min")
   *  - Wall-clock when the recipe assumes a canonical day shape ("4:30 PM",
   *    "Day 2 · 10:30 AM", "Fri · 6 PM")
   *  Cowork's call per recipe — anchor-relative for cultural + nonprofit;
   *  wall-clock with day prefix for corporate. CC renders verbatim — no
   *  re-derivation into clock times in V1. */
  time: string;

  /** Display label — the row title. Brief (under ~60 chars). The recipe
   *  prose markdown remains canonical for long-form context. */
  title: string;

  /** Optional vendor/role attribution for the row. Display "vendor" column.
   *  Examples: "officiant", "photographer", "band lead", "venue coordinator",
   *  "pandit", "auctioneer", "MC", "dhol player".
   *  Cowork-author convention: filled only when the prose explicitly names
   *  a vendor role for this beat. Don't infer. */
  vendor?: string;

  /** Optional 1–2 sentence "why this matters / what to watch" note.
   *  Surfaces on row tap (V-2+; just store today).
   *  Cowork-author convention: filled when the prose flags failure modes,
   *  recovery moves, or "why this matters" content for this specific beat. */
  note?: string;
};

export type RoSRecipe = {
  /** Stable recipe key. snake_case. Becomes the filename + the import key. */
  key: string;

  /** Display label, EN. */
  labelEn: string;

  /** Display label, ES (DFW register — tú form; brand terms English). */
  labelEs: string;

  /** Which event_type this recipe applies to. CC dispatches recipes based
   *  on event.event_type first, then narrows by event_subtype. */
  eventType: "wedding" | "corporate" | "nonprofit" | "public_cultural" | "social";

  /** event_subtype keys that should pick this recipe. Multiple OK if a
   *  recipe covers multiple sub-types. Match against keys in
   *  data/budget-presets.ts SUBTYPES exactly.
   *
   *  COWORK FLAG: I do not have read access to data/budget-presets.ts.
   *  Values below come from CC's filename+key table in the request brief.
   *  CC: please cross-check at integration. If any miss, either add the
   *  subtype or tell me what to change.
   *
   *  Empty array = "any subtype within eventType" (fallback / generic). */
  eventSubtypes: string[];

  /** Phase-anchored items. All 12 phases are valid but recipes may skip
   *  some (e.g., a corporate sales kickoff may have no "anchor_moment" in
   *  the ritual sense — the keynote takes its place; recipe-author's call
   *  whether to use anchor_moment for the keynote or omit it). */
  items: RoSItem[];

  /** Optional per-recipe phase label overrides. Highest-precedence label
   *  source in the resolver (phaseLabel() in phase-labels-by-event-type.ts).
   *
   *  V1 ships with phase-labels-by-EVENT-TYPE only (wedding / corporate /
   *  nonprofit get tailored chip + header copy). This field is the hook for
   *  per-recipe deeper precision: a Catholic wedding's anchor_moment is
   *  "Nuptial Mass" vs Protestant's "Vows + first dance" vs Hindu's
   *  "Saptapadi". Cowork populates per recipe in their next session — when
   *  this field is set on a recipe, its values override the event-type
   *  defaults for any phase listed.
   *
   *  Cowork-author convention when populating: only override phases where
   *  the recipe-specific term reads materially better than the wedding /
   *  corporate / nonprofit default. Don't replicate the event-type label
   *  with a synonym — let the default carry. */
  phaseLabels?: Partial<Record<RoSPhase, string>>;
};
