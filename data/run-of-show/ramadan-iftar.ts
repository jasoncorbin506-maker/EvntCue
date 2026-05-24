// data/run-of-show/ramadan-iftar.ts
//
// Ramadan Iftar — Run of Show (community-scale or family hosting)
//
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Ramadan iftar
// Source: cultural-research/religious-holidays/ramadan-iftar.md
//
// V2 Tier 3. Iftar is the daily fast-breaking meal during Ramadan, occurring
// at sunset (time varies daily). This recipe covers hosting a community-scale
// iftar (at masjid or community center) or a family-hosted iftar gathering.
// Daily home iftars during Ramadan are handled by event_custom_milestones.
//
// Anchor: iftar begins precisely at sunset (Maghrib time).

import type { RoSRecipe } from "./types";

const ramadanIftar: RoSRecipe = {
  key: "ramadan_iftar",
  labelEn: "Ramadan Iftar",
  labelEs: "Iftar de Ramadán",
  eventType: "public_cultural",
  eventSubtypes: ["ramadan_iftar", "iftar"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "iftar_capacity_planning",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-28",
      title: "IFTAR CAPACITY PLANNING · community-scale iftars (masjid / center) require monthly schedule",
      note:
        "Major masjids in DFW (Islamic Center of Irving, IANT, East Plano " +
        "Islamic Center) serve 100-500+ at community iftars during Ramadan.",
    },
    {
      key: "sponsor_recruitment",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-21",
      title: "Sponsor recruitment · donors sponsor specific nights' iftars",
      note:
        "Sponsoring an iftar is a major sadaqah (charitable) act during " +
        "Ramadan. Sponsors often dedicate iftars in memory of deceased family.",
    },
    {
      key: "menu_planning_halal",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-7",
      title: "Menu planned · biryani / mandi / qabuli / regional rice dish + dates + fruit + samosas",
      note:
        "Traditional break-fast: dates + water first (Sunnah), then full meal. " +
        "Regional variation — South Asian biryani vs Arab kabsa vs Levantine mansaf.",
    },
    {
      key: "sunset_time_confirmed",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-1",
      title: "Sunset time (Maghrib) confirmed for the date · varies ~1 min per day",
      note:
        "Critical — guests break fast precisely at sunset. Times posted on " +
        "masjid websites + apps (IslamicFinder, Muslim Pro).",
    },
    {
      key: "food_preparation",
      phase: "load_in",
      slot: 10,
      time: "iftar − 8 h",
      title: "Day-of food preparation · large-batch cooking",
      vendor: "halal caterer or volunteer kitchen team",
    },
    {
      key: "venue_setup_gender_sections",
      phase: "load_in",
      slot: 20,
      time: "iftar − 3 h",
      title: "Venue setup · gender-segregated sections (if observant masjid) · dates + water at each seat",
    },
    {
      key: "imam_attends",
      phase: "vip_arrivals",
      slot: 10,
      time: "iftar − 30 min",
      title: "Imam arrives · brief reminder (khatira) prepared",
      vendor: "imam",
    },
    {
      key: "fasting_attendees_arrive",
      phase: "guest_arrivals",
      slot: 10,
      time: "iftar − 20 min",
      title: "Fasting attendees arrive · seated · water + dates at each place setting",
      note:
        "Many arrive having fasted 14-16 hours. Quiet anticipation in the " +
        "final minutes before sunset.",
    },
    {
      key: "adhan_called",
      phase: "opening_moment",
      slot: 10,
      time: "iftar − 1 min",
      title: "Adhan (call to prayer) called · room falls silent",
      vendor: "muezzin",
    },
    {
      key: "fast_breaks_with_dates",
      phase: "anchor_moment",
      slot: 10,
      time: "iftar + 0",
      title: "FAST BREAKS · dates + water consumed first (Sunnah) · brief silent gratitude",
      note:
        "The moment of Maghrib. Tradition: break with odd number of dates " +
        "(1, 3, 5, 7). Followed by silent dua before the meal.",
    },
    {
      key: "maghrib_prayer",
      phase: "anchor_moment",
      slot: 20,
      time: "iftar + 5 min",
      title: "MAGHRIB PRAYER · sunset prayer immediately after dates/water",
      vendor: "imam",
      note:
        "Brief congregational prayer. Three rakat. After prayer the full meal begins.",
    },
    {
      key: "full_meal_served",
      phase: "continuation_arc",
      slot: 10,
      time: "iftar + 20 min",
      title: "Full iftar meal served · biryani / regional rice / curry / kebabs / sides",
    },
    {
      key: "imam_khatira",
      phase: "continuation_arc",
      slot: 20,
      time: "iftar + 60 min",
      title: "Brief reminder (khatira) from imam · 5-10 min reflection on Ramadan themes",
      vendor: "imam",
    },
    {
      key: "isha_prayer",
      phase: "continuation_arc",
      slot: 30,
      time: "iftar + 90 min",
      title: "Isha prayer (night prayer) · congregational",
    },
    {
      key: "taraweeh_prayer",
      phase: "continuation_arc",
      slot: 40,
      time: "iftar + 2 h",
      title: "TARAWEEH PRAYER · special Ramadan night prayer · 8 or 20 rakat",
      vendor: "imam",
      note:
        "Lengthy — 60-120 minutes. Quran recited extensively (often complete " +
        "Quran read across the 30 nights of Ramadan). Many attendees stay; " +
        "some depart after Isha.",
    },
    {
      key: "attendees_depart",
      phase: "send_off",
      slot: 10,
      time: "iftar + 4 h",
      title: "Attendees depart · sponsors thanked · cleanup begins",
    },
    {
      key: "cleanup_dishes",
      phase: "strike",
      slot: 10,
      time: "iftar + 5 h",
      title: "Cleanup · dishes washed · venue reset for next night",
    },
  ],
};

export default ramadanIftar;
