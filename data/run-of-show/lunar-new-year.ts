// data/run-of-show/lunar-new-year.ts
//
// Lunar New Year — Run of Show (Chinese / Vietnamese / Korean)
//
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Lunar New Year
// Source: cultural-research/religious-holidays/lunar-new-year.md
//
// V2 Tier 3. 15-day festival; most active first 7 days. This recipe covers
// the modal user case — hosting the reunion dinner (New Year's Eve) +
// Day 1 family gathering. Full 15-day observance uses event_custom_milestones.
//
// Anchor: reunion dinner on New Year's Eve (the most important meal of
// the festival).

import type { RoSRecipe } from "./types";

const lunarNewYear: RoSRecipe = {
  key: "lunar_new_year",
  labelEn: "Lunar New Year",
  labelEs: "Año Nuevo Lunar",
  eventType: "public_cultural",
  eventSubtypes: ["lunar_new_year"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "house_cleaning",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-3",
      title: "House cleaning BEFORE New Year · cleaning ON New Year sweeps away luck",
      note:
        "Cleaning on Day 1 itself sweeps away the year's good fortune. Must be " +
        "completed in advance.",
    },
    {
      key: "red_decor_couplets",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-2",
      title: "Red decorations + door couplets (chun lian) hung · spring scrolls + fu character",
    },
    {
      key: "reunion_dinner_food_prep",
      phase: "load_in",
      slot: 10,
      time: "reunion dinner − 8 h",
      title: "Reunion dinner food prep · whole fish (yu) + dumplings + long noodles + nian gao",
      note:
        "Each dish symbolic: fish = abundance, dumplings = wealth, long noodles " +
        "= longevity, nian gao (sticky rice cake) = higher year.",
    },
    {
      key: "family_traditional_dress",
      phase: "vip_arrivals",
      slot: 10,
      time: "reunion dinner − 2 h",
      title: "Family in traditional or new clothes · often red",
    },
    {
      key: "extended_family_arrives",
      phase: "guest_arrivals",
      slot: 10,
      time: "reunion dinner − 60 min",
      title: "Extended family arrives · multi-generational gathering",
    },
    {
      key: "ancestral_altar_offerings",
      phase: "opening_moment",
      slot: 10,
      time: "reunion dinner − 30 min",
      title: "Offerings made at ancestral altar · incense + food · ancestors honored",
    },
    {
      key: "reunion_dinner",
      phase: "anchor_moment",
      slot: 10,
      time: "reunion dinner + 0",
      title: "REUNION DINNER · the most important meal of the festival",
      note:
        "Whole family must be present if possible. Empty seats for absent family " +
        "set with chopsticks and rice bowl as symbolic placeholder.",
    },
    {
      key: "midnight_firecrackers",
      phase: "continuation_arc",
      slot: 10,
      time: "reunion dinner + 5 h",
      title: "Midnight firecrackers · welcoming New Year · scaring away nian (mythological beast)",
      note: "Where legally allowed. DFW: check Plano/Frisco/Richardson ordinances.",
    },
    {
      key: "day_1_family_visits",
      phase: "continuation_arc",
      slot: 20,
      time: "Day 1 morning",
      title: "Day 1 · family elders honored · younger generation bows + receives blessings",
    },
    {
      key: "hongbao_distribution",
      phase: "continuation_arc",
      slot: 30,
      time: "Day 1 + 0",
      title: "HONGBAO · red envelope cash gifts from married elders to unmarried + children",
      note:
        "Crisp new bills only. Even amounts typically (except 4, which sounds " +
        "like 'death'). Amounts scale with relationship closeness.",
    },
    {
      key: "vegetarian_breakfast_day_1",
      phase: "continuation_arc",
      slot: 40,
      time: "Day 1 morning",
      title: "Vegetarian breakfast on Day 1 (purification + Buddhist practice)",
    },
    {
      key: "lion_dragon_dance_attendance",
      phase: "continuation_arc",
      slot: 50,
      time: "Days 2-5",
      title: "Lion + dragon dance community celebrations attended",
      vendor: "lion dance troupe",
      note:
        "DFW Chinese cultural associations host community lion dances during " +
        "first week. Plano + Richardson + Carrollton venues typical.",
    },
    {
      key: "lantern_festival_day_15",
      phase: "send_off",
      slot: 10,
      time: "Day 15",
      title: "LANTERN FESTIVAL · final day of celebration · sweet rice balls (tangyuan)",
      note:
        "Marks end of New Year period. Many families observe; some compress " +
        "the 15-day festival into just the first 3.",
    },
  ],
};

export default lunarNewYear;
