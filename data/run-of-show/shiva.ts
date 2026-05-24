// data/run-of-show/shiva.ts
// Shiva — Jewish Seven-Day Mourning Period
//
// V2 Tier 5. Seven-day mourning period beginning immediately after burial.
// Mourners "sit shiva" at home; community gathers for daily minyan (prayer
// service requiring 10 adult Jews) + provides meals and visits. Distinct
// religious observance — not a celebration but a deeply communal ritual.
//
// SACRED RULE REMINDER (Lock 22): treat with dignified language; no jokes;
// no money in immediate visual adjacency. This recipe is exclusively about
// supporting the bereaved.
//
// Anchor: shiva begins immediately post-burial (the seudat havraah — meal
// of consolation — is the first meal of mourning).

import type { RoSRecipe } from "./types";

const shiva: RoSRecipe = {
  key: "shiva",
  labelEn: "Shiva",
  labelEs: "Shiva (luto judío)",
  eventType: "social",
  eventSubtypes: ["shiva"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "mourners_return_from_burial",
      phase: "opening_moment",
      slot: 10,
      time: "shiva + 0",
      title: "Mourners return from burial · wash hands at door (no water carried inside)",
      note:
        "Shiva begins the moment mourners return from cemetery. Hand-washing " +
        "at door symbolizes separation between death and home.",
    },
    {
      key: "seudat_havraah",
      phase: "first_arc",
      slot: 10,
      time: "shiva + 30 min",
      title: "SEUDAT HAVRAAH · meal of consolation · first meal post-burial",
      vendor: "friends + community (NOT family)",
      note:
        "Provided by friends, neighbors, and community — NOT prepared by " +
        "mourners. Traditional foods: hard-boiled eggs (cycle of life), lentils " +
        "(round form represents continuity), bread.",
    },
    {
      key: "shiva_house_prepared",
      phase: "load_in",
      slot: 10,
      time: "shiva + 1 h",
      title: "Shiva house prepared · mirrors covered · low chairs for mourners · candle lit",
      note:
        "Mirrors covered (mourner's focus inward, not outward); mourners sit on " +
        "low chairs or floor (humility before grief); seven-day memorial candle " +
        "lit and kept burning the full week.",
    },
    {
      key: "daily_minyan_evening",
      phase: "continuation_arc",
      slot: 10,
      time: "shiva + 12 h",
      title: "Daily minyan (evening) · 10 adult Jews gather for prayer at house",
      vendor: "rabbi (often)",
      note:
        "Mourners cannot say Kaddish without a minyan (10 adult Jews — gendered " +
        "by denomination). Community organizes to ensure minyan happens at least " +
        "evening + morning. Rabbi often present or coordinates.",
    },
    {
      key: "daily_minyan_morning",
      phase: "continuation_arc",
      slot: 20,
      time: "shiva + 24 h",
      title: "Daily minyan (morning) · second daily service",
    },
    {
      key: "shiva_visits_begin",
      phase: "continuation_arc",
      slot: 30,
      time: "shiva + 24 h",
      title: "Shiva visits begin · friends + family + community arrive throughout the week",
      note:
        "Visitors should NOT initiate conversation — wait for mourner to speak " +
        "first. Bring food (kosher requirements respected). Stay briefly unless " +
        "invited longer. Sit + be present rather than fill silence with words.",
    },
    {
      key: "meal_coordination_community",
      phase: "continuation_arc",
      slot: 40,
      time: "throughout 7 days",
      title: "Meal coordination · community fills calendar with meals delivered",
      vendor: "community organizers",
      note:
        "Synagogues + Jewish community organizations often run shiva meal " +
        "calendars. Family does NOT cook for themselves during shiva.",
    },
    {
      key: "kaddish_recited_daily",
      phase: "continuation_arc",
      slot: 50,
      time: "throughout 7 days",
      title: "Kaddish recited at each minyan · mourner's prayer",
      note:
        "Mourners recite Kaddish daily for 30 days (sheloshim — extended " +
        "mourning); for parents, 11 months. Shiva is the most intensive period.",
    },
    {
      key: "torah_study_visits",
      phase: "continuation_arc",
      slot: 60,
      time: "throughout 7 days",
      title: "Torah study or memorial readings · honoring the deceased",
    },
    {
      key: "shiva_concludes_seventh_day",
      phase: "send_off",
      slot: 10,
      time: "shiva + 7 days",
      title: "Shiva concludes · mourners take a short walk around the block",
      note:
        "Symbolic emergence from intense mourning. Sheloshim (lesser mourning) " +
        "continues for 30 days; for parents, full year of mourning continues.",
    },
  ],
};

export default shiva;
