// data/run-of-show/aqiqah.ts
// Aqiqah — Muslim Newborn Celebration
//
// V2 Tier 5. Sunnah celebration of a newborn, traditionally performed on
// the 7th day after birth (or 14th / 21st if not feasible on the 7th).
// Sheep / goat slaughtered for the celebration (two for a boy, one for a
// girl by mainstream Sunni tradition); meat distributed to family + poor.
// Baby's head is shaved + hair weight in silver is donated to charity.
//
// Anchor: aqiqah ceremony on 7th day after birth — naming announcement +
// head shaving.

import type { RoSRecipe } from "./types";

const aqiqah: RoSRecipe = {
  key: "aqiqah",
  labelEn: "Aqiqah (Newborn Celebration)",
  labelEs: "Aqiqah (celebración del recién nacido)",
  eventType: "social",
  eventSubtypes: ["aqiqah"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "qurbani_animal_arranged",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-3",
      title: "Aqiqah animal arranged · 2 sheep/goats for boy, 1 for girl (Sunni traditional)",
      vendor: "halal butcher",
      note:
        "DFW halal butchers (Plano / Richardson / Garland) coordinate aqiqah " +
        "slaughter. Some families perform locally; others sponsor aqiqah " +
        "remotely in Pakistan / Bangladesh / Yemen where meat goes directly " +
        "to needy communities.",
    },
    {
      key: "name_chosen_meaning",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-3",
      title: "Baby's name chosen · meaning + Quranic root verified",
      note:
        "Tradition: name should have positive meaning. Often Arabic root from " +
        "Quran or hadith.",
    },
    {
      key: "head_shaving_kit",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1",
      title: "Head shaving kit prepared · scale to weigh hair",
    },
    {
      key: "venue_setup_home",
      phase: "load_in",
      slot: 10,
      time: "aqiqah − 3 h",
      title: "Venue setup · usually family home · gender-segregated sections if observant",
    },
    {
      key: "halal_caterer_setup",
      phase: "load_in",
      slot: 20,
      time: "aqiqah − 3 h",
      title: "Halal caterer setup · meat from aqiqah featured · biryani + kebabs + traditional dishes",
      vendor: "halal caterer",
    },
    {
      key: "family_dressed",
      phase: "vip_arrivals",
      slot: 10,
      time: "aqiqah − 90 min",
      title: "Family in modest dress · baby dressed in special outfit",
    },
    {
      key: "guests_arrive",
      phase: "guest_arrivals",
      slot: 10,
      time: "aqiqah − 15 min",
      title: "Extended family + close friends arrive · gifts presented",
    },
    {
      key: "naming_announcement",
      phase: "anchor_moment",
      slot: 10,
      time: "aqiqah + 0",
      title: "NAMING ANNOUNCEMENT · baby's name formally announced · meaning shared",
    },
    {
      key: "head_shaving_charity",
      phase: "anchor_moment",
      slot: 20,
      time: "aqiqah + 15 min",
      title: "HEAD SHAVING · hair weighed in silver · equivalent value donated to charity",
      note:
        "Sunnah practice. Hair shaved, weighed, and silver of equivalent value " +
        "given to the poor. Often a few grams of silver — symbolic act of " +
        "sadaqah (charity) at the beginning of the baby's life.",
    },
    {
      key: "dua_for_baby",
      phase: "anchor_moment",
      slot: 30,
      time: "aqiqah + 25 min",
      title: "Du'a for the baby · imam or elder leads prayer for child's wellbeing",
      vendor: "imam or elder",
    },
    {
      key: "meal_with_aqiqah_meat",
      phase: "continuation_arc",
      slot: 10,
      time: "aqiqah + 45 min",
      title: "Meal served · aqiqah meat featured · biryani + kebabs · sweets for dessert",
    },
    {
      key: "meat_distribution",
      phase: "day_after",
      slot: 10,
      time: "D+1",
      title: "Meat distribution · to extended family + neighbors + needy",
      note:
        "Sunnah: divide meat into thirds — family, friends/relatives, poor/needy. " +
        "Often coordinated with masjid or community organization for distribution.",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "aqiqah + 3 h",
      title: "Guests depart · informal close",
    },
  ],
};

export default aqiqah;
