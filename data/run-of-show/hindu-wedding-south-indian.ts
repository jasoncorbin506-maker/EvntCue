// data/run-of-show/hindu-wedding-south-indian.ts
//
// Hindu Wedding (South Indian) — Run of Show
//
// Source: cultural-research/weddings/hindu-wedding-south-indian.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md notes
//   "Shares muhurat anchoring with North Indian. Distinct sub-event names
//   (Nichayathartham engagement, Kashi Yatra, Maalai Maatral, Saptapadi).
//   Cross-reference for shared mechanics; the divergence is in ritual
//   content, not in anchor classification."
//
// V2 recipe. Modal here is Tamil/Telugu Brahmin (largest DFW South
// Indian cohort). Malayali / Kannada variants noted in comments.
//
// Time format: anchor-relative around "saptapadi" / "muhurat window" —
// shares the same muhurat-anchored architecture as Hindu N-Indian.
//
// Anchor: saptapadi (Tamil) OR Jeelakarra Bellam (Telugu — cumin + jaggery
// paste applied to each other's heads, the moment Telugu couples are
// declared married). Both must land inside muhurat window.
//
// Key differences from N-Indian:
//   - Morning ceremony (not evening); prep starts 3-4am
//   - Shorter overall (2-3 days vs 4-7)
//   - Temple-centric, Vedic-traditional
//   - Banana-leaf feast on floor (not banquet seated)
//   - Nadaswaram + tavil music (not dhol)
//   - Distinct sub-rituals (Kashi Yatra, Oonjal, Talambralu, Ammi Midithal)

import type { RoSRecipe } from "./types";

const hinduWeddingSouthIndian: RoSRecipe = {
  key: "hindu_wedding_south_indian",
  labelEn: "Hindu Wedding (South Indian)",
  labelEs: "Boda hindú (sur de India)",
  eventType: "wedding",
  eventSubtypes: ["hindu_south_indian"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging ───────────────────────────────────────────
    {
      key: "nischayathartham_engagement",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-180 to D-7 (engagement, often earlier)",
      title: "NISCHAYATHARTHAM · pandit-led formal engagement · muhurat announced",
      vendor: "pandit",
      note:
        "More structured than North Indian engagement. The wedding's muhurat is " +
        "formally announced here.",
    },
    {
      key: "pallikai_sprouting_grains",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-1",
      title: "PALLIKAI · ritual planting of nine grains in earthenware pots",
      note:
        "Performed the day before the wedding to invoke fertility and prosperity. " +
        "Pots immersed in flowing water after the wedding.",
    },
    {
      key: "sumangali_prarthana",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1",
      title: "SUMANGALI PRARTHANA · married women of bride's family bless her (Brahmin)",
    },
    {
      key: "optional_mehndi_sangeet",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-1 · evening",
      title: "Optional Mehndi + Sangeet (modern second-generation addition)",
      vendor: "mehndi artist",
      note:
        "Not historically required in South Indian tradition. Increasingly common " +
        "in US second-generation families as adopted North Indian celebrations. " +
        "Traditional grandparents may consider these imports.",
    },

    // ─── load_in ───────────────────────────────────────────────────
    {
      key: "pre_dawn_pandit_setup",
      phase: "load_in",
      slot: 10,
      time: "muhurat − 4 h",
      title: "Pandit confirms ceremony items · agni materials · banana leaves · jasmine garlands",
      vendor: "pandit",
    },
    {
      key: "satvik_caterer_setup",
      phase: "load_in",
      slot: 20,
      time: "muhurat − 3 h",
      title: "Pure-veg / Satvik caterer load-in · banana-leaf serving setup",
      vendor: "caterer",
      note:
        "Brahmin-strict catering: no onion, no garlic, no root vegetables. Cooking " +
        "infrastructure must be Brahmin-acceptable (separate utensils, no co-mingling). " +
        "Banana-leaf serving requires floor seating capability.",
    },

    // ─── vip_arrivals ──────────────────────────────────────────────
    {
      key: "bride_styling_predawn",
      phase: "vip_arrivals",
      slot: 10,
      time: "muhurat − 4 h · pre-dawn 3-4 AM",
      title: "Bride styling · madisar saree drape (Iyer) · gold jewelry adorning (1-2 hr)",
      vendor: "hair / makeup",
      note:
        "Bridal jewelry adorning is itself a 1-2 hour event with multiple family " +
        "women involved. Hair/makeup teams must start very early — 3am-4am is " +
        "not unusual for major South Indian wedding days.",
    },
    {
      key: "groom_arrives_madhu_parka",
      phase: "vip_arrivals",
      slot: 20,
      time: "muhurat − 90 min",
      title: "Groom arrives · MADHU-PARKA · bride's father offers honey + ghee + yogurt",
      note:
        "Bride's father formally receives the groom as a respected guest at the " +
        "venue entrance.",
    },

    // ─── guest_arrivals ───────────────────────────────────────────
    {
      key: "guests_arrive_mandap",
      phase: "guest_arrivals",
      slot: 10,
      time: "muhurat − 75 min",
      title: "Guests arrive · seated near mandap · nadaswaram + tavil music plays",
      vendor: "nadaswaram + tavil ensemble",
      note:
        "Nadaswaram (long reed instrument) + tavil (drum) is the traditional South " +
        "Indian wedding music — considered auspicious, played during saptapadi and " +
        "key ritual moments. No equivalent in North Indian planning.",
    },

    // ─── opening_moment ────────────────────────────────────────────
    {
      key: "kashi_yatra",
      phase: "opening_moment",
      slot: 10,
      time: "muhurat − 60 min",
      title: "KASHI YATRA · groom's comedic 'renunciation' · father-in-law persuades",
      note:
        "Tamil / Telugu / Kannada Brahmin tradition. Groom packs umbrella + walking " +
        "stick + coconut + rice, declares his intention to walk to Kashi for spiritual " +
        "life, is 'persuaded' to abandon journey for marriage. Often the most " +
        "photographed light moment of the day.",
    },
    {
      key: "oonjal_swing_tamil",
      phase: "opening_moment",
      slot: 20,
      time: "muhurat − 40 min",
      title: "OONJAL · bride + groom on decorated swing · women sing · fed milk + bananas (Tamil)",
      note:
        "Tamil-specific. Swing's motion symbolizes life's ups and downs; family " +
        "steadies the couple.",
    },

    // ─── first_arc ─────────────────────────────────────────────────
    {
      key: "pandit_vedic_preliminaries",
      phase: "first_arc",
      slot: 10,
      time: "muhurat − 20 min",
      title: "Pandit's Vedic preliminaries · agni lit at mandap",
      vendor: "pandit",
    },
    {
      key: "kanyadaan",
      phase: "first_arc",
      slot: 20,
      time: "muhurat − 12 min",
      title: "KANYADAAN · bride's father gives bride's hand to groom",
    },
    {
      key: "mangal_phera",
      phase: "first_arc",
      slot: 30,
      time: "muhurat − 5 min",
      title: "MANGAL PHERA · couple walks around agni 4 or 7 times",
    },

    // ─── anchor_moment ─────────────────────────────────────────────
    {
      key: "saptapadi",
      phase: "anchor_moment",
      slot: 10,
      time: "muhurat window · 0",
      title: "SAPTAPADI · seven steps around the agni · MUST land inside muhurat",
      vendor: "pandit",
      note:
        "Same muhurat constraint as Hindu N-Indian. Slipping outside the window " +
        "reads as religiously compromised by traditional family.",
    },
    {
      key: "mangalsutram_three_knots",
      phase: "anchor_moment",
      slot: 20,
      time: "muhurat + 5 min",
      title: "MANGALSUTRAM · tied with THREE knots (1st by groom, 2nd by sister, 3rd by groom)",
      note:
        "Three-knot tradition distinct from North Indian single-knot mangalsutra. " +
        "Key visual + emotional moment.",
    },
    {
      key: "talambralu_telugu",
      phase: "anchor_moment",
      slot: 30,
      time: "muhurat + 10 min",
      title: "TALAMBRALU · bride + groom shower each other with rice + turmeric (Telugu)",
      note:
        "Playful, photographed extensively, often the visual highlight of the day. " +
        "The moment the Telugu wedding becomes a celebration.",
    },
    {
      key: "jeelakarra_bellam_telugu",
      phase: "anchor_moment",
      slot: 40,
      time: "muhurat + 14 min",
      title: "JEELAKARRA BELLAM · cumin + jaggery paste applied to heads (Telugu marriage moment)",
      note:
        "When this is done, the couple is declared married in Telugu tradition. " +
        "Parallel to saptapadi as the legal moment.",
    },
    {
      key: "ammi_midithal_tamil",
      phase: "anchor_moment",
      slot: 50,
      time: "muhurat + 18 min",
      title: "AMMI MIDITHAL · groom places bride's foot on grindstone (Tamil steadiness ritual)",
    },

    // ─── transition ────────────────────────────────────────────────
    {
      key: "aashirvad_blessings",
      phase: "transition",
      slot: 10,
      time: "muhurat + 25 min",
      title: "Aashirvad · elders' blessings · akshintalu (turmeric rice) sprinkled",
    },

    // ─── continuation_arc (banana-leaf feast) ──────────────────────
    {
      key: "banana_leaf_feast",
      phase: "continuation_arc",
      slot: 10,
      time: "muhurat + 50 min",
      title: "WEDDING FEAST on banana leaves · seated cross-legged on floor",
      vendor: "caterer",
      note:
        "Traditional South Indian wedding feast. Specialty service staff who know " +
        "the proper sequence (rice + sambhar + rasam + curd in order, ghee at " +
        "specific moments). Different aesthetic from N-Indian banquet seating.",
    },

    // ─── send_off + strike ─────────────────────────────────────────
    {
      key: "wedding_day_concludes_early",
      phase: "send_off",
      slot: 10,
      time: "muhurat + 3 h",
      title: "Wedding day concludes by early afternoon · family rests before reception",
    },
    {
      key: "pallikai_immersion",
      phase: "strike",
      slot: 10,
      time: "muhurat + 4 h",
      title: "Pallikai pots immersed in flowing water · vendor breakdown",
    },

    // ─── day_after (RECEPTION evening or D+1) ──────────────────────
    {
      key: "reception_evening",
      phase: "day_after",
      slot: 10,
      time: "evening of OR D+1",
      title: "Reception · bride changes to different lehenga or gown · MC + DJ + dancing",
      vendor: "DJ",
      note:
        "More Western-influenced. Often hosted by groom's family at separate venue.",
    },
  ],
};

export default hinduWeddingSouthIndian;
