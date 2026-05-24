// data/run-of-show/chinese-wedding.ts
//
// Chinese Wedding (Tea Ceremony + Banquet) — Run of Show
//
// Source: cultural-research/weddings/chinese-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Chinese wedding table
//   - guo_da_li_betrothal (relative, -3 months)
//   - auspicious_date_consultation (relative, -12 months)
//   - tea_ceremony (relative, -3 hours from Western ceremony OR standalone anchor)
//   - western_ceremony (relative, 0)
//   - banquet_reception (relative, +3 hours)
//
// V2 recipe. Modal here is Cantonese (most ritually elaborate; lion dance,
// elaborate door games, qun kwa). Mandarin / Hokkien / Shanghainese / Taiwanese
// variants noted in comments.
//
// Time format: dual anchor — "tea ceremony" for morning family ceremonies,
// wall-clock for evening banquet. Most Chinese-American weddings are hybrid
// (tea + optional Western + banquet) on a single day.
//
// Anchor: tea ceremonies at family altars (both bride's and groom's homes).

import type { RoSRecipe } from "./types";

const chineseWedding: RoSRecipe = {
  key: "chinese_wedding",
  labelEn: "Chinese Wedding (Tea Ceremony + Banquet)",
  labelEs: "Boda china (ceremonia del té + banquete)",
  eventType: "wedding",
  eventSubtypes: ["chinese"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging ───────────────────────────────────────────
    {
      key: "guo_da_li_betrothal",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-90 (often earlier)",
      title: "GUO DA LI · groom's family delivers betrothal gifts (pin li) to bride's family",
      note:
        "Cantonese tradition especially. Gold jewelry, tea, lotus paste cakes, " +
        "wine, ornate trays. Bride's family often returns a portion. Cultural-" +
        "economic transfer separate from wedding-day costs; analogous to Muslim " +
        "mahr + Vietnamese lễ vật.",
    },
    {
      key: "hair_combing_ceremony",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-1 · evening",
      title: "HAIR COMBING · 'lucky' married woman combs bride/groom hair · 4 strokes of blessings",
      note:
        "Held the night before at each family's home separately. Older married " +
        "woman whose marriage has been 'lucky' (both spouses alive, with children, " +
        "prosperous) combs hair while reciting: long life, harmony, abundant " +
        "children/grandchildren, prosperity.",
    },

    // ─── load_in ───────────────────────────────────────────────────
    {
      key: "tea_set_setup_brides_home",
      phase: "load_in",
      slot: 10,
      time: "tea ceremony − 2 h",
      title: "Tea set + red cushions set up at bride's family altar",
      note:
        "Ceremonial tea (typically lotus tea, red date tea, or sweet tea), " +
        "formal tea set, red dishes, red cushion for kneeling.",
    },
    {
      key: "banquet_hall_setup",
      phase: "load_in",
      slot: 20,
      time: "banquet − 4 h",
      title: "Chinese banquet hall setup · red + gold decor · double-happiness (囍) signage",
    },

    // ─── vip_arrivals ──────────────────────────────────────────────
    {
      key: "bride_styling_red_qipao",
      phase: "vip_arrivals",
      slot: 10,
      time: "tea ceremony − 3 h",
      title: "Bride styling · qun kwa or red qipao + hair · groom in formal attire",
      vendor: "hair / makeup",
      note:
        "Bride wears red — color of luck and joy. Often three outfits across the " +
        "day: white Western gown for ceremony, red qipao or qun kwa for tea, third " +
        "reception dress.",
    },

    // ─── guest_arrivals (door games) ───────────────────────────────
    {
      key: "door_games_chuangmen",
      phase: "guest_arrivals",
      slot: 10,
      time: "tea ceremony − 45 min",
      title: "DOOR GAMES · groom + groomsmen 'pass tests' set by bridesmaids · hongbao 'ransom'",
      note:
        "Especially central in Cantonese weddings; lighter or absent in Northern " +
        "Chinese / Mandarin. Tests: four flavors (sour/sweet/bitter/spicy), " +
        "questions about the bride, songs, dances. Light and photographed.",
    },

    // ─── opening_moment (groom enters bride's home) ────────────────
    {
      key: "groom_presents_hongbao_bride_emerges",
      phase: "opening_moment",
      slot: 10,
      time: "tea ceremony − 15 min",
      title: "Groom presents hongbao to bridesmaids · bride emerges",
    },

    // ─── first_arc (bows + tea at bride's home) ────────────────────
    {
      key: "bows_to_brides_parents",
      phase: "first_arc",
      slot: 10,
      time: "tea ceremony − 5 min",
      title: "Couple bows to bride's parents at altar",
    },

    // ─── anchor_moment (tea ceremonies at both homes) ──────────────
    {
      key: "tea_ceremony_brides_family",
      phase: "anchor_moment",
      slot: 10,
      time: "tea ceremony + 0",
      title: "TEA CEREMONY · bride's home · tea to bride's parents + elders",
      note:
        "Cultural and spiritual centerpiece. Tea must be accepted; refusal would " +
        "be deeply disrespectful. Each elder gives back hongbao or jewelry " +
        "(particularly gold for Cantonese 'four-piece' or 'five-piece' tradition).",
    },
    {
      key: "couple_departs_to_grooms",
      phase: "anchor_moment",
      slot: 20,
      time: "tea ceremony + 20 min",
      title: "Couple departs bride's home with groom's family",
    },
    {
      key: "tea_ceremony_grooms_family",
      phase: "anchor_moment",
      slot: 30,
      time: "tea ceremony + 50 min",
      title: "TEA CEREMONY · groom's home · tea to groom's parents + elders",
      note:
        "Bride formally accepted into groom's family. Tea poured by both partners; " +
        "elders bless and return hongbao/jewelry.",
    },

    // ─── transition (Western ceremony if included) ─────────────────
    {
      key: "optional_western_ceremony",
      phase: "transition",
      slot: 10,
      time: "tea ceremony + 2 h",
      title: "Optional Western ceremony at church or venue",
      note:
        "Chinese Christian (Protestant or Catholic) families often add a church " +
        "ceremony. Chinese churches in DFW have bilingual Mandarin or Cantonese " +
        "pastors.",
    },
    {
      key: "group_photos",
      phase: "transition",
      slot: 20,
      time: "tea ceremony + 4 h",
      title: "Group photos · couple transitions to banquet venue",
      vendor: "photographer",
    },

    // ─── continuation_arc (the banquet) ────────────────────────────
    {
      key: "lion_dance_entrance",
      phase: "continuation_arc",
      slot: 10,
      time: "6:00 PM",
      title: "LION DANCE entrance · auspicious opening (Cantonese)",
      vendor: "lion dance troupe",
      note:
        "High-energy performance kicks off the reception. Cantonese weddings " +
        "especially. Some traditional versions include fire / firework elements " +
        "— venue clearance required.",
    },
    {
      key: "couple_grand_entrance",
      phase: "continuation_arc",
      slot: 20,
      time: "6:15 PM",
      title: "Couple's grand entrance · MC announces (bilingual)",
      vendor: "MC",
    },
    {
      key: "banquet_courses_begin",
      phase: "continuation_arc",
      slot: 30,
      time: "6:30 PM",
      title: "Banquet courses begin · 8 / 10 / 12 symbolic dishes (2-3 hours)",
      vendor: "Chinese banquet hall",
      note:
        "Each dish carries meaning: whole steamed fish (yu — abundance/surplus), " +
        "suckling pig (purity), long noodles (long life), red bean soup or sweet " +
        "glutinous rice balls (sweet life and unity). 8 is most auspicious number.",
    },
    {
      key: "table_toasts_endurance",
      phase: "continuation_arc",
      slot: 40,
      time: "7:00 PM",
      title: "Couple toasts every table · sometimes 30+ tables (non-alcoholic tea typical)",
      note:
        "Real endurance moment. Bride toasts with tea, not baijiu — 30+ shots of " +
        "actual baijiu would be incapacitating. MC manages pacing.",
    },
    {
      key: "bride_third_outfit_change",
      phase: "continuation_arc",
      slot: 50,
      time: "8:00 PM",
      title: "Bride changes into reception dress (third outfit) mid-banquet",
    },
    {
      key: "cake_cutting_sweet_soup",
      phase: "continuation_arc",
      slot: 60,
      time: "9:30 PM",
      title: "Cake cutting · sweet soup as final course (sweet finale)",
    },
    {
      key: "hongbao_collection",
      phase: "continuation_arc",
      slot: 70,
      time: "throughout evening",
      title: "Hongbao gifts collected at designated table throughout the evening",
      note:
        "Cash gifts in red envelopes from guests. Informal norm: hongbao roughly " +
        "equals or exceeds per-guest banquet cost. For larger weddings, hongbao " +
        "meaningfully offsets net banquet cost.",
    },

    // ─── send_off + strike ─────────────────────────────────────────
    {
      key: "guests_depart_close",
      phase: "send_off",
      slot: 10,
      time: "10:30 PM",
      title: "Guests depart · informal close",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "11:00 PM",
      title: "Banquet hall vendor breakdown",
    },

    // ─── day_after ─────────────────────────────────────────────────
    {
      key: "hongbao_acknowledgment",
      phase: "day_after",
      slot: 10,
      time: "D+1 to D+7",
      title: "Hongbao tracking + thank-you notes to gift-givers",
      note:
        "Tracking and acknowledging cash gifts post-wedding is a multi-day task " +
        "in current practice. EvntCue's structured hongbao tracking + auto-draft " +
        "thank-you notes is a meaningful insertion point.",
    },
  ],
};

export default chineseWedding;
