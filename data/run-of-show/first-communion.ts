// data/run-of-show/first-communion.ts
// Catholic First Communion
//
// V2 Tier 4. Catholic coming-of-age sacrament — typically age 7-8 (second
// grade in most US parishes). Marks first reception of the Eucharist after
// completing first reconciliation (confession). Parish-scheduled, often a
// single Mass for all candidates from the parish's CCD/PSR class.
//
// Anchor: first reception of communion at the Mass.

import type { RoSRecipe } from "./types";

const firstCommunion: RoSRecipe = {
  key: "first_communion",
  labelEn: "First Communion",
  labelEs: "Primera Comunión",
  eventType: "social",
  eventSubtypes: ["first_communion"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "religious_education",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-365 to D-30 (year-long)",
      title: "1-2 years of religious education (CCD / PSR) completed",
    },
    {
      key: "first_reconciliation",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-60",
      title: "FIRST RECONCILIATION · first confession completed (must precede First Communion)",
      vendor: "parish priest",
    },
    {
      key: "communion_dress_or_suit",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-30",
      title: "White communion dress (girls) or suit (boys) acquired · veils + ties + shoes",
    },
    {
      key: "rehearsal_at_parish",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-7",
      title: "Rehearsal at parish · candidates walk processional + practice receiving",
    },
    {
      key: "morning_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "Mass − 90 min",
      title: "Family + candidate prep · child dressed in white attire · group photos at home",
    },
    {
      key: "family_arrives_parish",
      phase: "guest_arrivals",
      slot: 10,
      time: "Mass − 30 min",
      title: "Family arrives at parish · godparents + extended family seated together",
    },
    {
      key: "processional",
      phase: "opening_moment",
      slot: 10,
      time: "Mass + 0",
      title: "First Communion processional · candidates enter in pairs",
    },
    {
      key: "homily_explains_eucharist",
      phase: "first_arc",
      slot: 10,
      time: "Mass + 15 min",
      title: "Pastor's homily · explains Eucharist for the children + families",
      vendor: "parish priest",
    },
    {
      key: "first_communion",
      phase: "anchor_moment",
      slot: 10,
      time: "Mass + 35 min",
      title: "FIRST COMMUNION · child receives the Eucharist for the first time",
      vendor: "parish priest",
      note:
        "The sacramental moment. Often the most photographed Catholic " +
        "childhood event. Photographer + family typically positioned for shots.",
    },
    {
      key: "group_photos_after_mass",
      phase: "transition",
      slot: 10,
      time: "Mass + 60 min",
      title: "Group photos at altar · individual photos with priest",
      vendor: "photographer",
    },
    {
      key: "family_reception",
      phase: "continuation_arc",
      slot: 10,
      time: "Mass + 90 min",
      title: "Family reception · home, restaurant, or parish hall · gifts presented",
      note:
        "Common gifts: rosary, Bible, saint medal, crucifix, religious " +
        "jewelry. From godparents, grandparents, parents.",
    },
    {
      key: "meal_with_family",
      phase: "continuation_arc",
      slot: 20,
      time: "Mass + 2 h",
      title: "Family meal · cake cutting · child as honoree",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "Mass + 5 h",
      title: "Reception concludes",
    },
  ],
};

export default firstCommunion;
