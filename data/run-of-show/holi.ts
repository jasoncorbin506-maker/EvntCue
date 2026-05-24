// data/run-of-show/holi.ts
//
// Holi — Run of Show
//
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Holi
// Source: cultural-research/religious-holidays/holi.md
//
// V2 Tier 3. Two-day festival of colors (Holika Dahan bonfire night +
// main color-throwing day).
//
// Anchor: main Holi day color-throwing celebration.

import type { RoSRecipe } from "./types";

const holi: RoSRecipe = {
  key: "holi",
  labelEn: "Holi",
  labelEs: "Holi",
  eventType: "public_cultural",
  eventSubtypes: ["holi"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "color_powder_purchase",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-3",
      title: "GULAL (color powder) purchased · multiple colors · organic preferred",
      note:
        "DFW Indian grocery stores in Irving / Plano stock seasonally. Organic " +
        "powders for skin safety; synthetic for traditional intensity.",
    },
    {
      key: "venue_selection_outdoor",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-7",
      title: "Outdoor venue confirmed · backyard / park / temple grounds",
      note:
        "Color throwing requires outdoor space and water access. DFW temple " +
        "grounds (DFW Hindu Temple in Irving, Karya Siddhi Hanuman in Frisco) " +
        "often host community Holi celebrations.",
    },
    {
      key: "old_clothes_designated",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1",
      title: "Old white or light-colored clothes designated for color staining",
      note:
        "Stains permanent. Guests informed in advance to wear disposable clothes.",
    },
    {
      key: "holika_dahan_bonfire",
      phase: "load_in",
      slot: 10,
      time: "main day − 12 h",
      title: "HOLIKA DAHAN · bonfire night before · symbolic burning of evil",
      note:
        "Where legally permitted. DFW temple grounds + community-organized " +
        "burns. Some families substitute small backyard fire pit or candle.",
    },
    {
      key: "food_prep_thandai_gujiya",
      phase: "load_in",
      slot: 20,
      time: "main day − 4 h",
      title: "Thandai (spiced milk drink) + gujiya (sweet fried pastry) prepared",
    },
    {
      key: "family_in_old_clothes",
      phase: "vip_arrivals",
      slot: 10,
      time: "main day − 60 min",
      title: "Family changes into designated old clothes · oil applied to hair + skin for color protection",
    },
    {
      key: "guests_arrive_no_phones",
      phase: "guest_arrivals",
      slot: 10,
      time: "main day − 30 min",
      title: "Guests arrive · electronics secured in plastic bags · 'Holi Hai!' greeting",
    },
    {
      key: "color_throwing_begins",
      phase: "anchor_moment",
      slot: 10,
      time: "main day + 0",
      title: "COLOR THROWING begins · gulal smeared on faces · powder thrown · water sprays + balloons",
      note:
        "Mutual application — guests smear color on each other. No hierarchy: " +
        "elders, kids, hosts, guests all participate equally.",
    },
    {
      key: "music_dancing",
      phase: "continuation_arc",
      slot: 10,
      time: "main day + 1 h",
      title: "Bollywood music + Holi songs · dancing outdoors",
      vendor: "DJ",
    },
    {
      key: "cleanup_rinse",
      phase: "continuation_arc",
      slot: 20,
      time: "main day + 3 h",
      title: "Cleanup · guests rinse with hose · towels and changing area provided",
    },
    {
      key: "feast_thandai_gujiya",
      phase: "continuation_arc",
      slot: 30,
      time: "main day + 4 h",
      title: "Feast · thandai + gujiya + Holi snacks · pakoras + chaat",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "main day + 6 h",
      title: "Guests depart · informal close",
    },
    {
      key: "cleanup_outdoor",
      phase: "strike",
      slot: 10,
      time: "main day + 7 h",
      title: "Outdoor cleanup · pressure wash if at home venue",
    },
  ],
};

export default holi;
