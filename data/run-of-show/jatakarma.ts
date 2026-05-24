// data/run-of-show/jatakarma.ts
// Jatakarma + Namakarana — Hindu Birth + Naming Ceremonies
//
// V2 Tier 5. Jatakarma is performed at birth (whispered into infant's ear);
// Namakarana is the formal naming ceremony traditionally on the 11th day
// after birth. Modern Hindu families often combine both into a single
// home-based ceremony.
//
// Anchor: naming ceremony at muhurat-fixed time within 11-day window.

import type { RoSRecipe } from "./types";

const jatakarma: RoSRecipe = {
  key: "jatakarma_namakarana",
  labelEn: "Jatakarma + Namakarana (Hindu Naming)",
  labelEs: "Jatakarma + Namakarana (ceremonia hindú del nombre)",
  eventType: "social",
  eventSubtypes: ["jatakarma", "namakarana", "hindu_naming"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "book_pandit",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-14",
      title: "Pandit booked · birth chart prepared for muhurat + naming consultation",
      vendor: "pandit",
    },
    {
      key: "naming_consultation",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-14",
      title: "Pandit consults birth chart for auspicious naming letter (nakshatra-based)",
      note:
        "Pandit identifies the auspicious starting letter for the baby's name " +
        "based on birth nakshatra (lunar mansion).",
    },
    {
      key: "homa_materials_prepared",
      phase: "load_in",
      slot: 10,
      time: "muhurat − 2 h",
      title: "Homa (fire ritual) materials prepared · ghee + samidha + flowers",
      vendor: "pandit",
    },
    {
      key: "satvik_food_prep",
      phase: "load_in",
      slot: 20,
      time: "muhurat − 3 h",
      title: "Satvik / pure-veg food preparation for family feast",
    },
    {
      key: "infant_dressed_traditional",
      phase: "vip_arrivals",
      slot: 10,
      time: "muhurat − 60 min",
      title: "Infant dressed in traditional outfit · kajal applied · prepared for ceremony",
    },
    {
      key: "family_arrives",
      phase: "guest_arrivals",
      slot: 10,
      time: "muhurat − 30 min",
      title: "Extended family arrives · seated around home altar",
    },
    {
      key: "ganesh_puja_invocation",
      phase: "opening_moment",
      slot: 10,
      time: "muhurat − 15 min",
      title: "Ganesh puja invocation · removing obstacles",
      vendor: "pandit",
    },
    {
      key: "homa_lit",
      phase: "first_arc",
      slot: 10,
      time: "muhurat − 5 min",
      title: "Sacred fire (homa) lit · Vedic mantras chanted",
      vendor: "pandit",
    },
    {
      key: "naming_ceremony",
      phase: "anchor_moment",
      slot: 10,
      time: "muhurat + 0",
      title: "NAMAKARANA · father whispers chosen name into infant's right ear",
      vendor: "pandit",
      note:
        "The naming moment. Father (or grandfather) whispers the name three " +
        "times. Some families also write the name on a plate of rice with " +
        "honey or ghee.",
    },
    {
      key: "name_announced_publicly",
      phase: "anchor_moment",
      slot: 20,
      time: "muhurat + 3 min",
      title: "Name announced publicly to gathered family · blessings sung",
    },
    {
      key: "family_blessings",
      phase: "transition",
      slot: 10,
      time: "muhurat + 15 min",
      title: "Elder blessings · gifts presented (often gold jewelry, silver coins, religious items)",
    },
    {
      key: "feast",
      phase: "continuation_arc",
      slot: 10,
      time: "muhurat + 45 min",
      title: "Vegetarian family feast",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "muhurat + 3 h",
      title: "Family departs · informal close",
    },
  ],
};

export default jatakarma;
