// data/run-of-show/diwali.ts
//
// Diwali — Run of Show (single celebration / Diwali night)
//
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Diwali table
// Source: cultural-research/religious-holidays/diwali.md
//
// V2 Tier 3 (religious holiday). Diwali is a 5-day festival; this recipe
// covers the modal user case — hosting a single Diwali night celebration
// (Day 3, the main Lakshmi puja night). Full 5-day observance uses
// event_custom_milestones for the other 4 days.
//
// Anchor: Lakshmi puja on Diwali main night (Day 3).

import type { RoSRecipe } from "./types";

const diwali: RoSRecipe = {
  key: "diwali",
  labelEn: "Diwali",
  labelEs: "Diwali",
  eventType: "public_cultural",
  eventSubtypes: ["diwali"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "home_cleaning_decoration",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-14",
      title: "Major home cleaning + decoration · welcoming Lakshmi",
    },
    {
      key: "mithai_ordering",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-7",
      title: "Mithai (Indian sweets) ordered or made for distribution",
    },
    {
      key: "firework_purchase",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-3",
      title: "Fireworks purchased (where legally allowed in DFW)",
      note: "Plano and Frisco have specific ordinances; check before purchase.",
    },
    {
      key: "rangoli_creation",
      phase: "load_in",
      slot: 10,
      time: "D-1",
      title: "RANGOLI · floor art at home entrance · colored powders + flowers",
    },
    {
      key: "diyas_lit",
      phase: "load_in",
      slot: 20,
      time: "Lakshmi puja − 2 h",
      title: "Diyas (oil lamps) lit throughout home · electric lights minimized",
    },
    {
      key: "family_in_traditional_dress",
      phase: "vip_arrivals",
      slot: 10,
      time: "Lakshmi puja − 90 min",
      title: "Family in traditional dress · saree / lehenga / sherwani / kurta",
    },
    {
      key: "guests_arrive_namaste",
      phase: "guest_arrivals",
      slot: 10,
      time: "Lakshmi puja − 30 min",
      title: "Guests arrive · namaste greeting · light snacks served",
    },
    {
      key: "puja_setup",
      phase: "opening_moment",
      slot: 10,
      time: "Lakshmi puja − 15 min",
      title: "Lakshmi + Ganesh puja altar prepared · flowers, fruits, incense, prasad",
    },
    {
      key: "puja_chanting",
      phase: "first_arc",
      slot: 10,
      time: "Lakshmi puja − 5 min",
      title: "Family gathers · puja chanting begins",
    },
    {
      key: "lakshmi_puja",
      phase: "anchor_moment",
      slot: 10,
      time: "Lakshmi puja + 0",
      title: "LAKSHMI PUJA · invoking goddess of wealth and prosperity",
      note:
        "Central religious moment of Diwali. Aarti performed; prasad blessed; " +
        "family receives blessings.",
    },
    {
      key: "aarti_prasad",
      phase: "anchor_moment",
      slot: 20,
      time: "Lakshmi puja + 15 min",
      title: "Aarti completed · prasad distributed to all attendees",
    },
    {
      key: "diwali_feast",
      phase: "continuation_arc",
      slot: 10,
      time: "Lakshmi puja + 45 min",
      title: "Diwali feast · vegetarian Indian food · mithai for dessert",
    },
    {
      key: "fireworks",
      phase: "continuation_arc",
      slot: 20,
      time: "Lakshmi puja + 2 h",
      title: "Fireworks · sparklers · family gathered outside",
    },
    {
      key: "mithai_exchange_with_neighbors",
      phase: "continuation_arc",
      slot: 30,
      time: "Lakshmi puja + 3 h",
      title: "Mithai exchanged with neighbors · cards delivered",
    },
    {
      key: "guests_depart",
      phase: "send_off",
      slot: 10,
      time: "Lakshmi puja + 4 h",
      title: "Guests depart · informal close",
    },
    {
      key: "diyas_burn_through_night",
      phase: "strike",
      slot: 10,
      time: "Lakshmi puja + 5 h",
      title: "Diyas left to burn through the night · welcoming Lakshmi's continued blessing",
    },
  ],
};

export default diwali;
