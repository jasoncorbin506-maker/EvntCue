// data/run-of-show/hanukkah-party.ts
//
// Hanukkah Party — Run of Show (single-night celebration, often first night)
//
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Hanukkah party
// Source: cultural-research/religious-holidays/hanukkah-party.md
//
// V2 Tier 3. 8-night Jewish festival of lights commemorating the Maccabean
// rededication of the Temple. This recipe covers hosting a Hanukkah party
// (typically first night or a weekend night during the 8 days). Family
// observances on remaining nights use event_custom_milestones.
//
// Anchor: candle lighting at sundown.

import type { RoSRecipe } from "./types";

const hanukkahParty: RoSRecipe = {
  key: "hanukkah_party",
  labelEn: "Hanukkah Party",
  labelEs: "Fiesta de Janucá",
  eventType: "public_cultural",
  eventSubtypes: ["hanukkah", "hanukkah_party"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "menorah_preparation",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-2",
      title: "Menorah polished + placed in window · candles gathered for 8 nights",
      note:
        "Menorah traditionally placed in window facing the street to publicize " +
        "the miracle.",
    },
    {
      key: "latke_or_sufganiyot_prep",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-1",
      title: "Latke (potato pancake) or sufganiyot (jelly donut) prep · oil-fried foods",
      note:
        "Fried foods commemorate the miracle of one day's oil lasting eight days. " +
        "Latkes (Ashkenazi) or sufganiyot (Israeli) — sometimes both.",
    },
    {
      key: "decorations_blue_white_silver",
      phase: "load_in",
      slot: 10,
      time: "candle lighting − 4 h",
      title: "Decorations · blue + white + silver · dreidels + gelt + Hanukkah signage",
    },
    {
      key: "food_prep_complete",
      phase: "load_in",
      slot: 20,
      time: "candle lighting − 2 h",
      title: "Food prep complete · latkes / sufganiyot / brisket / kugel",
    },
    {
      key: "family_arrives",
      phase: "vip_arrivals",
      slot: 10,
      time: "candle lighting − 60 min",
      title: "Family arrives · kids gather around menorah",
    },
    {
      key: "guests_arrive",
      phase: "guest_arrivals",
      slot: 10,
      time: "candle lighting − 30 min",
      title: "Guests arrive · drinks + appetizers served",
    },
    {
      key: "menorah_blessings",
      phase: "opening_moment",
      slot: 10,
      time: "candle lighting − 5 min",
      title: "Blessings prepared · shamash candle lit first",
    },
    {
      key: "candle_lighting",
      phase: "anchor_moment",
      slot: 10,
      time: "candle lighting + 0",
      title: "CANDLE LIGHTING · blessings sung · candles lit from right to left",
      note:
        "First night: one candle + shamash. Each subsequent night adds one more " +
        "candle (8 candles + shamash on the final night). Three blessings on the " +
        "first night; two on subsequent nights. Hanerot Halalu often sung " +
        "after lighting.",
    },
    {
      key: "maoz_tzur_sung",
      phase: "anchor_moment",
      slot: 20,
      time: "candle lighting + 5 min",
      title: "Maoz Tzur sung · 'Rock of Ages' hymn after lighting",
    },
    {
      key: "festive_meal",
      phase: "continuation_arc",
      slot: 10,
      time: "candle lighting + 30 min",
      title: "Festive meal · latkes with applesauce + sour cream · brisket + sides · sufganiyot for dessert",
    },
    {
      key: "gelt_distribution",
      phase: "continuation_arc",
      slot: 20,
      time: "candle lighting + 90 min",
      title: "GELT distributed · chocolate coins for kids · cash gelt from grandparents",
    },
    {
      key: "dreidel_games",
      phase: "continuation_arc",
      slot: 30,
      time: "candle lighting + 100 min",
      title: "Dreidel games · nun-gimmel-hey-shin · kids play for gelt",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "candle lighting + 4 h",
      title: "Guests depart · candles burn down naturally · informal close",
    },
    {
      key: "remaining_nights_home_observance",
      phase: "day_after",
      slot: 10,
      time: "D+1 to D+7",
      title: "Remaining 7 nights · home candle lighting + family observance · smaller scale",
    },
  ],
};

export default hanukkahParty;
