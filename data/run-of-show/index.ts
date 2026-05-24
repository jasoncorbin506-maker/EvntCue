// data/run-of-show/index.ts
//
// Run of Show recipe registry — read by CC's Scope B dispatcher to
// pick the right recipe per event.
//
// Per Jason's 2026-05-24 direction ("functional for everyone at launch"):
// V1 ships 7 deep recipes (CC's request set) + 1 universal fallback.
// The other ~37 traditions from the cultural-research/_milestone-anchor-
// mapping.md become V2 deliverables ("second launch" per Jason) — each
// added as a pure data drop: write a new TS file, import here, push to
// ALL_RECIPES. No schema or read-path changes required.
//
// CC's dispatch logic (suggested):
//
//   import { ALL_RECIPES } from "@/data/run-of-show";
//
//   function pickRecipe(event: { event_type: string; event_subtype: string | null }) {
//     // Try tradition-specific match first (event_type + event_subtype)
//     const specific = ALL_RECIPES.find(r =>
//       r.eventType === event.event_type &&
//       r.eventSubtypes.length > 0 &&
//       (event.event_subtype != null && r.eventSubtypes.includes(event.event_subtype))
//     );
//     if (specific) return specific;
//
//     // Try generic-within-eventType (recipe with empty eventSubtypes)
//     const generic = ALL_RECIPES.find(r =>
//       r.eventType === event.event_type && r.eventSubtypes.length === 0
//     );
//     if (generic) return generic;
//
//     // Universal fallback (key = "universal_fallback")
//     return ALL_RECIPES.find(r => r.key === "universal_fallback")!;
//   }
//
// CC: please review the dispatch shape — I made one judgment call worth
// flagging. The universal-fallback recipe is registered with
// eventType: "public_cultural" + eventSubtypes: []. If your dispatcher
// reads "empty eventSubtypes within a matching eventType" as the catch-
// all, then a non-public-cultural event (e.g., a "social" subtype not
// in any recipe's eventSubtypes) would NOT fall through to universal
// unless your code explicitly checks for "universal_fallback" by key.
// Three viable resolutions:
//   1. Dispatcher uses key === "universal_fallback" as the explicit final
//      fallback (suggested in the code above) — simplest.
//   2. Add a new eventType value "any" or "fallback" to the union in
//      types.ts, and register universal_fallback with that — cleaner
//      type contract but requires a types.ts edit.
//   3. Register universal_fallback under EVERY eventType value (5 copies
//      with different keys) — silly and noisy; do not do.
// Recommend (1) for V1 ship; consider (2) for V2.

import type { RoSRecipe } from "./types";

// 7 tradition-specific recipes (CC's V1 request set)
import protestantWedding from "./protestant-wedding";
import catholicWedding from "./catholic-wedding";
import hinduWeddingNorthIndian from "./hindu-wedding-north-indian";
import quinceanera from "./quinceanera";
import barMitzvah from "./bar-mitzvah";
import salesKickoff from "./sales-kickoff";
import annualGala from "./annual-gala";

// 1 universal fallback (launch-readiness — no user lands on a blank
// Run of Show on July 12, 2026 even if their tradition isn't yet covered)
import universalFallback from "./universal-fallback";

export const ALL_RECIPES: readonly RoSRecipe[] = [
  // Tradition-specific recipes first — dispatcher checks these before
  // falling through to universal.
  protestantWedding,
  catholicWedding,
  hinduWeddingNorthIndian,
  quinceanera,
  barMitzvah,
  salesKickoff,
  annualGala,

  // Universal fallback LAST in the array so .find() preferring specific
  // matches naturally returns specific before generic. (The dispatcher
  // logic above doesn't depend on array order, but keeping fallback last
  // is a defensive convention.)
  universalFallback,
] as const;

// ─── V2 (second-launch) extension catalog ──────────────────────────
//
// The cultural-research/_milestone-anchor-mapping.md classifies 44
// traditions; only 8 of those are wired here in V1 (7 deep + universal
// fallback). The remaining traditions become V2 data drops. Per Jason's
// 2026-05-24 direction, the architecture above is designed so adding
// V2 traditions requires zero schema or read-path changes — only new
// files + new imports + new array entries.
//
// V2 candidate set (ordered by mapping coverage depth + DFW relevance):
//
//   Weddings:
//     - hindu-wedding-south-indian (mapping covers; uses muhurat anchor like N. Indian)
//     - sikh-wedding (Anand Karaj; gurdwara-anchored; mapping covers)
//     - muslim-wedding (Nikah + Walima; mapping covers)
//     - jewish-wedding (chuppah ceremony; mapping covers)
//     - greek-orthodox-wedding (mapping notes shared shape w/ Catholic)
//     - ethiopian-orthodox-wedding (3-day; mapping notes)
//     - korean-wedding (Paebaek + reception; mapping covers)
//     - vietnamese-wedding (3 sub-events; mapping covers)
//     - chinese-wedding (tea + Western + banquet; mapping covers)
//     - persian-wedding (Sofreh Aghd; mapping covers)
//     - yoruba-wedding (mapping covers)
//     - igbo-wedding (mapping covers)
//     - lgbtq-adapted-traditions (cross-reference modifier; mapping notes)
//
//   Coming-of-age:
//     - upanayanam (Hindu thread ceremony)
//     - confirmation (Catholic)
//     - first-communion (Catholic)
//     - sweet-sixteen
//     - debutante-ball
//     - seijin-shiki (Japanese)
//     - korean-coming-of-age
//
//   Life-cycle:
//     - baptism
//     - brit-milah
//     - jatakarma
//     - aqiqah
//     - shiva
//     - novena
//     - dia-de-los-muertos
//     - milestone-anniversary
//     - vow-renewal
//
//   Religious holidays:
//     - diwali (5-day)
//     - eid-al-fitr
//     - eid-al-adha
//     - lunar-new-year (15-day)
//     - holi
//     - navratri (9-night)
//     - nochebuena
//     - passover
//     - hanukkah (8-night)
//     - ramadan-iftar
//
// Process for adding a V2 recipe:
//   1. Author the prose recipe at product/run-of-show/{cultural,corporate,nonprofit}/{slug}.md
//      (if it doesn't already exist; cultural-research/ entries are
//      anthropological background, not RoS recipes — they may inform
//      the prose recipe but don't replace it)
//   2. Author the structured TS file at data/run-of-show/{slug}.ts
//      conforming to RoSRecipe shape from ./types
//   3. Cross-check eventSubtypes value against data/budget-presets.ts SUBTYPES
//   4. Add import + entry to ALL_RECIPES above
//   5. tsc clean check; no test changes required (read-path tests cover the dispatcher,
//      not individual recipes)
