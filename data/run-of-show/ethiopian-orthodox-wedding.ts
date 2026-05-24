// data/run-of-show/ethiopian-orthodox-wedding.ts
//
// Ethiopian Orthodox Wedding (also Eritrean Orthodox) — Run of Show
//
// Source: cultural-research/weddings/ethiopian-orthodox-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md notes
//   "For Ethiopian: kelekel_engagement (relative_to_start, -3 months),
//   mels_reception (relative_to_start, +1 day). Crowning ceremony — absolute
//   within the wedding ceremony."
//
// V2 Tier 2 recipe. Multi-day (3-5 days typical) Habesha celebration.
// Eritrean Orthodox shares the same ancient liturgy with minor regional
// variation; same recipe applies (override eventSubtypes to add).
//
// Anchor: crowning during the Mekri / Qurban service at the Ethiopian
// Orthodox parish — couple declared king and queen of their household.

import type { RoSRecipe } from "./types";

const ethiopianOrthodoxWedding: RoSRecipe = {
  key: "ethiopian_orthodox_wedding",
  labelEn: "Ethiopian Orthodox Wedding (Habesha)",
  labelEs: "Boda ortodoxa etíope (Habesha)",
  eventType: "wedding",
  // CC fix 2026-05-24 (session 18y V2 integration) — budget-presets.ts has
  // generic `ethiopian` only (no Orthodox/Eritrean regional split). Recipe
  // dispatches on all three so today's funnel (generic Ethiopian) lands this
  // recipe AND future regional splits work without recipe edits.
  eventSubtypes: ["ethiopian", "ethiopian_orthodox", "eritrean_orthodox"],
  items: [
    {
      key: "telosh_sealet_engagement",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-90",
      title: "TELOSH / SEALET · engagement · family-to-family formal introduction + gift exchange",
      note:
        "Engagement gifts often include traditional clothing, jewelry, household " +
        "goods, sometimes monetary. Analogous to mahr / mehrieh / lễ vật.",
    },
    {
      key: "habesha_kemis_sourced",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-60",
      title: "Habesha Kemis sourced · bride's white gown with tibeb embroidery",
      vendor: "Habesha Kemis tailor",
      note:
        "Specialty handwoven fabric + tibeb embroidery along hem, neckline, " +
        "sleeves. Family members + guests also wear coordinated kemis ($200-$800 " +
        "each). Sourced DFW or directly from Ethiopia.",
    },
    {
      key: "pre_communion_fasting",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1 evening to wedding day",
      title: "Pre-Communion fasting + confession (observant couples)",
      note:
        "Both partners must complete fasting + confession before the Qurban " +
        "(communion-paired wedding ceremony). Reception timing accommodates.",
    },
    {
      key: "pre_day_coffee_ceremony",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-1",
      title: "Pre-wedding coffee ceremony (bunna) at family home",
      note:
        "Coffee beans roasted, ground, brewed three times in jebena pot. Served " +
        "with popcorn or hambasha bread. Ethiopian / Eritrean hospitality ritual.",
    },
    {
      key: "church_setup",
      phase: "load_in",
      slot: 10,
      time: "Mekri − 3 h",
      title: "Ethiopian Orthodox parish setup · wedding crowns + ceremonial items",
      vendor: "Ethiopian Orthodox priest",
    },
    {
      key: "ethiopian_caterer_load_in",
      phase: "load_in",
      slot: 20,
      time: "Mekri − 4 h",
      title: "Ethiopian caterer load-in · injera + doro wat + kitfo + tibs + shiro prep",
      vendor: "Ethiopian caterer",
    },
    {
      key: "bride_habesha_kemis_dressing",
      phase: "vip_arrivals",
      slot: 10,
      time: "Mekri − 3 h",
      title: "Bride in Habesha Kemis + intricate hair styling · groom in Habesha libs + kaba",
      vendor: "hair / makeup",
      note:
        "Bride's white cotton gown with tibeb embroidery. Groom wears Habesha " +
        "libs (white tunic + trousers) + kaba (cape edged with gold embroidery).",
    },
    {
      key: "family_travels_to_church",
      phase: "vip_arrivals",
      slot: 20,
      time: "Mekri − 60 min",
      title: "Bride + bridal party travel to Ethiopian Orthodox parish",
    },
    {
      key: "congregation_arrives",
      phase: "guest_arrivals",
      slot: 10,
      time: "Mekri − 20 min",
      title: "Congregation arrives · seated in church · bilingual program if non-Habesha guests",
    },
    {
      key: "mekri_qurban_begins",
      phase: "opening_moment",
      slot: 10,
      time: "Mekri + 0",
      title: "MEKRI / QURBAN begins · liturgy in Ge'ez and Amharic / Tigrinya",
      vendor: "Ethiopian Orthodox priest",
      note:
        "Ge'ez is the ancient liturgical language. Service runs 60-120 minutes.",
    },
    {
      key: "scripture_blessings_anointing",
      phase: "first_arc",
      slot: 10,
      time: "Mekri + 15 min",
      title: "Reading of scripture · extended blessings · anointing",
    },
    {
      key: "wedding_ring_exchange",
      phase: "first_arc",
      slot: 20,
      time: "Mekri + 40 min",
      title: "Wedding ring exchange at appropriate liturgical moment",
    },
    {
      key: "crowning_with_wedding_crowns",
      phase: "anchor_moment",
      slot: 10,
      time: "Mekri + 55 min",
      title: "CROWNING · priest places crowns on bride + groom · king and queen of new household",
      vendor: "Ethiopian Orthodox priest",
      note:
        "Central religious moment. Crowns may be temporary (returned after) or " +
        "kept as relic.",
    },
    {
      key: "qurban_holy_communion",
      phase: "anchor_moment",
      slot: 20,
      time: "Mekri + 75 min",
      title: "QURBAN · Holy Communion · couple receives together (observant)",
      note:
        "Holy Communion integral to wedding rite for the most observant couples. " +
        "Pre-Communion fasting + confession completed earlier.",
    },
    {
      key: "couple_procession_out",
      phase: "transition",
      slot: 10,
      time: "Mekri + 100 min",
      title: "Procession of couple out of church · traditional singing + clapping",
    },
    {
      key: "group_photos_at_church",
      phase: "transition",
      slot: 20,
      time: "Mekri + 110 min",
      title: "Group photos at church · procession to reception venue",
      vendor: "photographer",
    },
    {
      key: "couple_grand_entrance_eskista",
      phase: "continuation_arc",
      slot: 10,
      time: "reception start + 0",
      title: "Couple's grand entrance with ESKISTA dance · talking drummers + krar",
      vendor: "traditional music ensemble",
      note:
        "Eskista is distinctive shoulder-driven Ethiopian / Eritrean dance. " +
        "Featured throughout reception. Skilled dancers admired.",
    },
    {
      key: "bilingual_mc_speeches",
      phase: "continuation_arc",
      slot: 20,
      time: "reception start + 30 min",
      title: "Bilingual MC (Amharic / Tigrinya + English) · family blessings + speeches",
      vendor: "MC",
    },
    {
      key: "ethiopian_banquet",
      phase: "continuation_arc",
      slot: 30,
      time: "reception start + 75 min",
      title: "Multi-hour Ethiopian banquet · injera + doro wat + kitfo + tibs + beg wat",
      vendor: "Ethiopian caterer",
    },
    {
      key: "gursha_hand_feeding",
      phase: "continuation_arc",
      slot: 40,
      time: "reception start + 2 h",
      title: "GURSHA · couple feeds each other by hand · family members feed each other",
      note:
        "Symbolizes love and care. Photographed extensively. Family-bonding moment.",
    },
    {
      key: "coffee_ceremony_reception",
      phase: "continuation_arc",
      slot: 50,
      time: "reception start + 3 h",
      title: "Coffee ceremony (bunna) at reception · frankincense smoke + popcorn",
    },
    {
      key: "traditional_dance_continues",
      phase: "continuation_arc",
      slot: 60,
      time: "reception start + 4 h",
      title: "Eskista + Ethiopian / Eritrean pop · dance floor packed",
      vendor: "Ethiopian / Eritrean DJ",
    },
    {
      key: "reception_runs_late",
      phase: "send_off",
      slot: 10,
      time: "reception start + 8 h",
      title: "Reception runs 6-10 hours · informal close past midnight",
      note:
        "Habesha receptions run very long. Venue contracts must allow.",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "reception start + 10 h",
      title: "Vendor breakdown",
    },
    {
      key: "mels_celebration",
      phase: "day_after",
      slot: 10,
      time: "D+1",
      title: "MELS · post-wedding celebration hosted by bride's family",
      note:
        "Often considered as meaningful as the wedding day itself. Couple wears " +
        "finest Habesha attire (including embroidered kaba); receives blessings " +
        "from both families.",
    },
  ],
};

export default ethiopianOrthodoxWedding;
