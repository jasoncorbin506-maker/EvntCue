// data/run-of-show/nochebuena.ts
//
// Nochebuena — Run of Show (Hispanic Catholic Christmas Eve)
//
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Nochebuena
// Source: cultural-research/religious-holidays/nochebuena.md
//
// V2 Tier 3. Hispanic Catholic Christmas Eve — multi-generational family
// feast typically running late into the night, capped by Misa de Gallo
// (Midnight Mass) for observant families.
//
// Anchor: late-night family feast (often 8-10 PM start) + Misa de Gallo
// at midnight.

import type { RoSRecipe } from "./types";

const nochebuena: RoSRecipe = {
  key: "nochebuena",
  labelEn: "Nochebuena (Hispanic Christmas Eve)",
  labelEs: "Nochebuena",
  eventType: "public_cultural",
  eventSubtypes: ["nochebuena"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "posadas_9_nights",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-9 to D-1",
      title: "POSADAS · 9 nights of community processions reenacting Mary + Joseph seeking shelter",
      note:
        "Each night a different family hosts; procession arrives + 'requests " +
        "shelter' through song + is welcomed in for fellowship. DFW Hispanic " +
        "Catholic parishes coordinate community posadas through Advent.",
    },
    {
      key: "tamales_making_day",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-2",
      title: "TAMALES MAKING · large-batch family tamale assembly (often 200-500 tamales)",
      note:
        "Tamale-making day is itself a family event — multi-generational + " +
        "all-day. Husks soaked, masa spread, fillings prepared, tamales steamed " +
        "in large pots.",
    },
    {
      key: "extended_food_prep",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1",
      title: "Extended food prep · pernil / pavo / lechon · arroz con gandules · pasteles",
      note:
        "Specific menu varies by country of origin — Mexican (tamales + bacalao + " +
        "ponche), Puerto Rican (pernil + arroz con gandules + pasteles), Cuban " +
        "(lechon asado + black beans + yuca), etc.",
    },
    {
      key: "nacimiento_setup",
      phase: "load_in",
      slot: 10,
      time: "feast − 6 h",
      title: "Nacimiento (nativity scene) prepared · baby Jesus laid at midnight",
      note:
        "Baby Jesus traditionally placed in the manger at midnight, not before. " +
        "Wait until Misa de Gallo concludes.",
    },
    {
      key: "table_set_christmas_decor",
      phase: "load_in",
      slot: 20,
      time: "feast − 4 h",
      title: "Table set · Christmas decor · ponche (warm fruit punch) simmering",
    },
    {
      key: "family_in_holiday_dress",
      phase: "vip_arrivals",
      slot: 10,
      time: "feast − 2 h",
      title: "Family arrives + dressed for the night · multi-generational gathering",
    },
    {
      key: "guests_arrive",
      phase: "guest_arrivals",
      slot: 10,
      time: "feast − 30 min",
      title: "Extended family + close friends arrive · greetings + ponche served",
    },
    {
      key: "opening_blessing",
      phase: "opening_moment",
      slot: 10,
      time: "feast + 0",
      title: "Opening blessing · grace before meal · senior family member leads",
    },
    {
      key: "nochebuena_feast",
      phase: "anchor_moment",
      slot: 10,
      time: "feast + 5 min",
      title: "NOCHEBUENA FEAST · late-night multi-course family meal · tamales + meat + sides",
      note:
        "Heart of the celebration. Often runs 2-3 hours. Conversation, music, " +
        "storytelling integral.",
    },
    {
      key: "music_dancing",
      phase: "continuation_arc",
      slot: 10,
      time: "feast + 2 h",
      title: "Music + dancing · villancicos (Christmas carols) · salsa / merengue / cumbia",
    },
    {
      key: "gift_exchange_optional",
      phase: "continuation_arc",
      slot: 20,
      time: "feast + 3 h",
      title: "Gift exchange (where families do gifts on Christmas Eve vs Christmas Day)",
      note:
        "Mexican families often open gifts on Nochebuena. Other traditions wait " +
        "until Christmas Day morning. Confirm family practice.",
    },
    {
      key: "travel_to_misa_de_gallo",
      phase: "continuation_arc",
      slot: 30,
      time: "11:30 PM",
      title: "Family travels to parish for Misa de Gallo (Midnight Mass)",
    },
    {
      key: "misa_de_gallo",
      phase: "continuation_arc",
      slot: 40,
      time: "12:00 AM",
      title: "MISA DE GALLO · Midnight Mass · Christmas Eve into Christmas Day",
      vendor: "parish priest",
      note:
        "Bilingual Mass at Hispanic Catholic parishes in DFW (especially in " +
        "Oak Cliff, Garland, Irving). Often the most-attended Mass of the year.",
    },
    {
      key: "return_home_baby_jesus_placed",
      phase: "send_off",
      slot: 10,
      time: "1:30 AM (Christmas Day)",
      title: "Return home · baby Jesus placed in nacimiento · family disperses",
    },
    {
      key: "christmas_day_continues",
      phase: "day_after",
      slot: 10,
      time: "Christmas Day",
      title: "Christmas Day continues with extended visits + leftovers + gift exchanges",
    },
  ],
};

export default nochebuena;
