// data/run-of-show/novena.ts
// Novena — Nine-Day Catholic Prayer Cycle
//
// V2 Tier 5. Nine consecutive days of prayer for a specific intention —
// healing, gratitude, mourning, special grace. Can be private (individual)
// or communal (parish-led or family-hosted). This recipe covers the modal
// case: family-hosted communal novena, typically in honor of a deceased
// family member (novena de difuntos) or in petition for a specific grace.
//
// Anchor: Day 9 culminating gathering — often the largest of the nine days.

import type { RoSRecipe } from "./types";

const novena: RoSRecipe = {
  key: "novena",
  labelEn: "Novena",
  labelEs: "Novena",
  eventType: "social",
  eventSubtypes: ["novena"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "intention_chosen",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-9 (day before Day 1)",
      title: "Intention chosen · for healing / mourning / petition / gratitude / saint's feast preparation",
    },
    {
      key: "saint_or_devotion_selected",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-9",
      title: "Saint or devotion selected · matching prayer text gathered",
      note:
        "Common: Sacred Heart, Divine Mercy, Our Lady of Guadalupe, St. Joseph, " +
        "St. Jude. Hispanic Catholic novenas often use specific liturgical text " +
        "(libritos de novena).",
    },
    {
      key: "altar_setup_home",
      phase: "load_in",
      slot: 10,
      time: "Day 1 − 4 h",
      title: "Home altar prepared · saint's image + candles + flowers + photo of intention recipient",
    },
    {
      key: "prayer_booklets_distributed",
      phase: "load_in",
      slot: 20,
      time: "Day 1 − 2 h",
      title: "Prayer booklets distributed · same prayers said all 9 days",
    },
    {
      key: "day_1_gathering",
      phase: "vip_arrivals",
      slot: 10,
      time: "Day 1 + 0",
      title: "Day 1 · family + close friends gather at home",
    },
    {
      key: "rosary_or_chaplet",
      phase: "first_arc",
      slot: 10,
      time: "Day 1 + 15 min",
      title: "Rosary or chaplet recited · novena prayers added",
    },
    {
      key: "scripture_reflection",
      phase: "first_arc",
      slot: 20,
      time: "Day 1 + 45 min",
      title: "Scripture reading + reflection · sometimes a brief shared meal afterward",
    },
    {
      key: "days_2_through_8_continue",
      phase: "continuation_arc",
      slot: 10,
      time: "Days 2-8",
      title: "Days 2-8 · prayers repeated daily · gathering size + format vary by family",
      note:
        "Some families hold full gatherings each night; others hold smaller " +
        "intimate prayer sessions on weekdays and larger gatherings on Sat/Sun.",
    },
    {
      key: "day_9_preparations",
      phase: "load_in",
      slot: 30,
      time: "Day 9 − 6 h",
      title: "Day 9 special preparations · extended family invited · meal planned for after prayers",
    },
    {
      key: "day_9_anchor_gathering",
      phase: "anchor_moment",
      slot: 10,
      time: "Day 9 + 0",
      title: "DAY 9 CULMINATION · largest gathering · special prayers concluding the novena",
      note:
        "Day 9 typically draws extended family + community. Often a priest is " +
        "invited to bless the gathering; sometimes Mass is celebrated in the home.",
    },
    {
      key: "memorial_meal",
      phase: "continuation_arc",
      slot: 20,
      time: "Day 9 + 60 min",
      title: "Memorial meal · family + friends share food after final prayers",
      note:
        "For novenas in memory of deceased (common in Hispanic Catholic " +
        "tradition): often traditional foods the deceased loved. Storytelling " +
        "and memory-sharing.",
    },
    {
      key: "altar_dismantled_respectfully",
      phase: "strike",
      slot: 10,
      time: "Day 9 + 24 h",
      title: "Altar respectfully dismantled · saint's image kept in home for ongoing devotion",
    },
  ],
};

export default novena;
