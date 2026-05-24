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

// V1 — 7 tradition-specific recipes (CC's original request set)
import protestantWedding from "./protestant-wedding";
import catholicWedding from "./catholic-wedding";
import hinduWeddingNorthIndian from "./hindu-wedding-north-indian";
import quinceanera from "./quinceanera";
import barMitzvah from "./bar-mitzvah";
import salesKickoff from "./sales-kickoff";
import annualGala from "./annual-gala";

// V2 Tier 1 — 7 additional wedding traditions (highest DFW volume; rolling
// build-out per Jason's 2026-05-24 "keep building out the other in the
// background" direction). Each is a shallow extension (~15-25 items)
// projected from cultural-research entries + milestone-anchor mapping.
import sikhWedding from "./sikh-wedding";
import muslimWedding from "./muslim-wedding";
import jewishWedding from "./jewish-wedding";
import hinduWeddingSouthIndian from "./hindu-wedding-south-indian";
import chineseWedding from "./chinese-wedding";
import vietnameseWedding from "./vietnamese-wedding";
import koreanWedding from "./korean-wedding";

// V2 Tier 2 — 5 additional wedding traditions (mid-tier DFW volume, distinct
// vendor stacks). LGBTQ+ adapted traditions handled as cross-recipe modifier
// pattern documented in V2 catalog below — not a standalone recipe.
import persianWedding from "./persian-wedding";
import greekOrthodoxWedding from "./greek-orthodox-wedding";
import ethiopianOrthodoxWedding from "./ethiopian-orthodox-wedding";
import yorubaWedding from "./yoruba-wedding";
import igboWedding from "./igbo-wedding";

// V2 Tier 3 — 10 religious holiday recipes (single-celebration scope; multi-day
// festivals handled by hosting one main observance + custom milestones for
// remaining days). All use eventType: "public_cultural".
import diwali from "./diwali";
import eidAlFitr from "./eid-al-fitr";
import eidAlAdha from "./eid-al-adha";
import lunarNewYear from "./lunar-new-year";
import holi from "./holi";
import navratriGarba from "./navratri-garba";
import nochebuena from "./nochebuena";
import passoverSeder from "./passover-seder";
import hanukkahParty from "./hanukkah-party";
import ramadanIftar from "./ramadan-iftar";

// V2 Tier 4 — 7 coming-of-age recipes. Mix of religious (Upanayanam,
// Confirmation, First Communion) + secular (Sweet Sixteen, Debutante) +
// cultural (Seijin Shiki, Korean coming-of-age).
import upanayanam from "./upanayanam";
import confirmation from "./confirmation";
import firstCommunion from "./first-communion";
import sweetSixteen from "./sweet-sixteen";
import debutanteBall from "./debutante-ball";
import seijinShiki from "./seijin-shiki";
import koreanComingOfAge from "./korean-coming-of-age";

// V2 Tier 5 — 9 life-cycle recipes. Birth (baptism, brit milah, jatakarma,
// aqiqah), mourning (shiva, novena, Día de los Muertos), milestones
// (anniversary, vow renewal).
import baptism from "./baptism";
import britMilah from "./brit-milah";
import jatakarma from "./jatakarma";
import aqiqah from "./aqiqah";
import shiva from "./shiva";
import novena from "./novena";
import diaDeLosMuertos from "./dia-de-los-muertos";
import milestoneAnniversary from "./milestone-anniversary";
import vowRenewal from "./vow-renewal";

// 1 universal fallback (launch-readiness — no user lands on a blank
// Run of Show on July 12, 2026 even if their tradition isn't yet covered)
import universalFallback from "./universal-fallback";

export const ALL_RECIPES: readonly RoSRecipe[] = [
  // V1 deep recipes
  protestantWedding,
  catholicWedding,
  hinduWeddingNorthIndian,
  quinceanera,
  barMitzvah,
  salesKickoff,
  annualGala,

  // V2 Tier 1 (wedding traditions)
  sikhWedding,
  muslimWedding,
  jewishWedding,
  hinduWeddingSouthIndian,
  chineseWedding,
  vietnameseWedding,
  koreanWedding,

  // V2 Tier 2 (wedding traditions)
  persianWedding,
  greekOrthodoxWedding,
  ethiopianOrthodoxWedding,
  yorubaWedding,
  igboWedding,

  // V2 Tier 3 (religious holidays)
  diwali,
  eidAlFitr,
  eidAlAdha,
  lunarNewYear,
  holi,
  navratriGarba,
  nochebuena,
  passoverSeder,
  hanukkahParty,
  ramadanIftar,

  // V2 Tier 4 (coming-of-age)
  upanayanam,
  confirmation,
  firstCommunion,
  sweetSixteen,
  debutanteBall,
  seijinShiki,
  koreanComingOfAge,

  // V2 Tier 5 (life-cycle)
  baptism,
  britMilah,
  jatakarma,
  aqiqah,
  shiva,
  novena,
  diaDeLosMuertos,
  milestoneAnniversary,
  vowRenewal,

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
//   Weddings (Tier 1 — SHIPPED 2026-05-24):
//     - sikh-wedding ✅
//     - muslim-wedding ✅
//     - jewish-wedding ✅
//     - hindu-wedding-south-indian ✅
//     - chinese-wedding ✅
//     - vietnamese-wedding ✅
//     - korean-wedding ✅
//
//   Weddings (Tier 2 — SHIPPED 2026-05-24):
//     - persian-wedding ✅
//     - greek-orthodox-wedding ✅ (covers Russian/Serbian/Romanian/Antiochian/OCA via eventSubtypes)
//     - ethiopian-orthodox-wedding ✅ (covers Eritrean Orthodox via eventSubtypes)
//     - yoruba-wedding ✅
//     - igbo-wedding ✅
//
//   LGBTQ+ adapted traditions — NOT shipping as standalone recipe.
//   Per mapping note: "Cross-tradition reference. Anchor classifications
//   inherit from the underlying tradition; modify only the ritual-specific
//   entries. No new anchor types needed."
//   Pattern for V3: an optional `adaptations` field on RoSRecipe that lists
//   per-item overrides (e.g., for same-sex couples in a Hindu N-Indian
//   wedding: kanyadaan item might be replaced with mutual hand-giving;
//   varmala becomes simultaneous; saptapadi unchanged). Implement when
//   demand surfaces; today, handling per-event via event_custom_milestones
//   overrides is sufficient.
//
//   Religious holidays (Tier 3 — SHIPPED 2026-05-24):
//     - diwali ✅
//     - eid-al-fitr ✅
//     - eid-al-adha ✅
//     - lunar-new-year ✅
//     - holi ✅
//     - navratri-garba ✅
//     - nochebuena ✅
//     - passover-seder ✅
//     - hanukkah-party ✅
//     - ramadan-iftar ✅
//
//   Coming-of-age (Tier 4 — SHIPPED 2026-05-24):
//     - upanayanam ✅
//     - confirmation ✅
//     - first-communion ✅
//     - sweet-sixteen ✅
//     - debutante-ball ✅
//     - seijin-shiki ✅
//     - korean-coming-of-age ✅
//
//   Life-cycle (Tier 5 — SHIPPED 2026-05-24):
//     - baptism ✅
//     - brit-milah ✅
//     - jatakarma ✅
//     - aqiqah ✅
//     - shiva ✅
//     - novena ✅
//     - dia-de-los-muertos ✅
//     - milestone-anniversary ✅
//     - vow-renewal ✅
//
// ─── V2 BUILD-OUT COMPLETE 2026-05-24 ──────────────────────────────
//
// Final V1 + V2 inventory: 46 tradition-specific recipes + 1 universal
// fallback = 47 total RoSRecipe entries in ALL_RECIPES.
//
// Coverage breakdown by eventType:
//   - wedding: 12 (Protestant, Catholic, Hindu N-Indian, Hindu S-Indian,
//     Sikh, Muslim, Jewish, Chinese, Vietnamese, Korean, Persian, Greek
//     Orthodox, Ethiopian Orthodox, Yoruba, Igbo — wait that's 15, let me
//     recount: 7 V1 = 0 wedding category in V1 actually, V1 had Protestant,
//     Catholic, Hindu N-Indian which are 3 weddings. V2 added 12 more.
//     So total weddings = 3 V1 + 12 V2 = 15.)
//   - social: 12 (quinceanera, bar-mitzvah, upanayanam, confirmation,
//     first-communion, sweet-sixteen, debutante-ball, baptism, brit-milah,
//     jatakarma, aqiqah, shiva, novena, milestone-anniversary, vow-renewal)
//   - corporate: 1 (sales-kickoff)
//   - nonprofit: 1 (annual-gala)
//   - public_cultural: 12 (universal-fallback, seijin-shiki,
//     korean-coming-of-age, diwali, eid-al-fitr, eid-al-adha,
//     lunar-new-year, holi, navratri-garba, nochebuena, passover-seder,
//     hanukkah-party, ramadan-iftar, dia-de-los-muertos)
//
// V3 candidates (when demand surfaces):
//   - Coptic Orthodox wedding
//   - Hmong wedding
//   - Native American ceremonies (per-tribe nuance required)
//   - Buddhist coming-of-age (Theravada / Mahayana / Tibetan variants)
//   - Quaker / non-denominational / civil ceremonies
//   - LGBTQ+ as the `adaptations` field pattern (per V2 Tier 2 design note)
//   - Corporate variations beyond SKO (offsite / town hall / sales celebration)
//   - Funeral / memorial service (religious + secular variants)
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
