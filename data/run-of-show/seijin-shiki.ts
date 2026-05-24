// data/run-of-show/seijin-shiki.ts
// Seijin Shiki — Japanese Coming-of-Age Ceremony
//
// V2 Tier 4. Japanese national coming-of-age holiday — second Monday in
// January annually. All 20-year-olds (changed to 18 in 2022, observance
// patterns still adjusting) attend municipal ceremonies in their hometown.
// Diaspora Japanese-American families often hold smaller local versions.
//
// Anchor: morning municipality ceremony + temple visit + family meal.

import type { RoSRecipe } from "./types";

const seijinShiki: RoSRecipe = {
  key: "seijin_shiki",
  labelEn: "Seijin Shiki (Japanese Coming-of-Age)",
  labelEs: "Seijin Shiki (mayoría de edad japonesa)",
  eventType: "public_cultural",
  eventSubtypes: ["seijin_shiki"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "furisode_rental",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-90",
      title: "FURISODE rental booked · long-sleeved formal kimono · accessories included",
      vendor: "kimono rental shop",
      note:
        "Furisode is the most formal kimono for unmarried young women. Rentals " +
        "are extremely competitive — popular shops book 6-12 months in advance.",
    },
    {
      key: "hakama_or_suit_men",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-60",
      title: "Men's hakama (traditional pants) or suit acquired",
    },
    {
      key: "hair_makeup_appointment_booked",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-30",
      title: "Hair + makeup appointment booked · early-morning slot (often 4-5 AM)",
      note:
        "Most popular hair salons book the second Monday months in advance. " +
        "Furisode hairstyles require 90-120 minutes of styling.",
    },
    {
      key: "hair_makeup_pre_dawn",
      phase: "vip_arrivals",
      slot: 10,
      time: "ceremony − 5 h",
      title: "Hair + makeup pre-dawn · traditional Japanese styling for furisode",
      vendor: "hair / makeup specialist",
    },
    {
      key: "kimono_dressing",
      phase: "vip_arrivals",
      slot: 20,
      time: "ceremony − 3 h",
      title: "Kimono dressing · specialist required for proper furisode draping (60-90 min)",
      vendor: "kimono dressing specialist",
    },
    {
      key: "family_photos_at_home",
      phase: "vip_arrivals",
      slot: 30,
      time: "ceremony − 90 min",
      title: "Family photos at home in furisode + hakama",
      vendor: "photographer",
    },
    {
      key: "travel_to_municipal_venue",
      phase: "guest_arrivals",
      slot: 10,
      time: "ceremony − 30 min",
      title: "Travel to municipal ceremony venue · city hall or community center",
    },
    {
      key: "municipal_ceremony_opens",
      phase: "opening_moment",
      slot: 10,
      time: "ceremony + 0",
      title: "Municipal mayor opens ceremony · address to new adults",
    },
    {
      key: "speeches_certificates",
      phase: "first_arc",
      slot: 10,
      time: "ceremony + 15 min",
      title: "Speeches + certificate distribution · all 20-year-olds (or 18 post-2022) honored",
    },
    {
      key: "group_photos_attendees",
      phase: "anchor_moment",
      slot: 10,
      time: "ceremony + 60 min",
      title: "Group photos · attendees reunite with old classmates · informal gathering",
      note:
        "Many attendees reconnect with elementary / middle school classmates " +
        "they haven't seen since graduation. Significant social-reunion element.",
    },
    {
      key: "temple_or_shrine_visit",
      phase: "transition",
      slot: 10,
      time: "ceremony + 2 h",
      title: "Temple or shrine visit · omikuji (fortune drawing) · prayers for adulthood",
      note:
        "Common but not universal. Some attendees visit shrines independently " +
        "or with family afterward.",
    },
    {
      key: "family_lunch_or_dinner",
      phase: "continuation_arc",
      slot: 10,
      time: "ceremony + 4 h",
      title: "Family lunch or dinner · honoree celebrated by extended family",
      note:
        "Often at a restaurant; sometimes at home. Honoree often gives a " +
        "short speech of thanks.",
    },
    {
      key: "reunion_with_friends_evening",
      phase: "continuation_arc",
      slot: 20,
      time: "ceremony + 8 h",
      title: "Reunion with old friends · informal evening gathering · bars / karaoke",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "late evening",
      title: "Day concludes",
    },
  ],
};

export default seijinShiki;
