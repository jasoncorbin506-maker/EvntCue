// data/run-of-show/brit-milah.ts
// Brit Milah / Bris — Jewish Covenant of Circumcision
//
// V2 Tier 5. Jewish ritual on the EIGHTH DAY after a male infant's birth.
// Religiously mandated; the date is fixed by Halakha. The bris establishes
// the covenant between God and the child. Performed by a mohel (specialist
// religious circumciser), usually at the family's home or synagogue.
//
// Anchor: the bris (circumcision) itself, performed by the mohel on the
// 8th day after birth.

import type { RoSRecipe } from "./types";

const britMilah: RoSRecipe = {
  key: "brit_milah",
  labelEn: "Brit Milah (Bris)",
  labelEs: "Brit Milá (Bris)",
  eventType: "social",
  eventSubtypes: ["brit_milah", "bris"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "book_mohel_at_birth",
      phase: "pre_day_staging",
      slot: 10,
      time: "day of birth (D-7 to D-3)",
      title: "Book mohel · arrange for 8th-day ceremony",
      vendor: "mohel",
      note:
        "Mohel booked as soon as boy is born. 8th-day requirement is " +
        "religiously mandated; mohel + family scramble to align schedules.",
    },
    {
      key: "sandek_kvatter_chosen",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-3",
      title: "Sandek + kvatter (kvatterin) chosen · honorary roles assigned",
      note:
        "Sandek holds the baby during the bris (highest honor; often a " +
        "grandfather). Kvatter / kvatterin (couple) carry the baby into the room.",
    },
    {
      key: "naming_chosen",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-3",
      title: "Hebrew name chosen · announced during the ceremony",
    },
    {
      key: "venue_setup_home_or_synagogue",
      phase: "load_in",
      slot: 10,
      time: "bris − 2 h",
      title: "Venue setup · home or synagogue social hall · Elijah's chair prepared",
      note:
        "Tradition: an empty chair set aside for the prophet Elijah, witness to " +
        "the covenant.",
    },
    {
      key: "festive_meal_prep",
      phase: "load_in",
      slot: 20,
      time: "bris − 90 min",
      title: "Seudat mitzvah (festive meal) prep · bagels + lox + dairy spread typical",
      vendor: "caterer or family",
      note:
        "Mitzvah to celebrate the bris with a festive meal. Often dairy spread " +
        "(easier for morning observance + kosher logistics).",
    },
    {
      key: "family_arrives_morning",
      phase: "vip_arrivals",
      slot: 10,
      time: "bris − 30 min",
      title: "Family arrives morning of · baby's mother prepares · sandek + kvatter ready",
    },
    {
      key: "guests_arrive",
      phase: "guest_arrivals",
      slot: 10,
      time: "bris − 15 min",
      title: "Extended family + close friends arrive · minyan ideally present (10 adult Jews)",
    },
    {
      key: "kvatter_carries_baby_in",
      phase: "opening_moment",
      slot: 10,
      time: "bris − 5 min",
      title: "Kvatter (kvatterin) carries baby into the room · 'Baruch ha-ba!'",
    },
    {
      key: "sandek_holds_baby",
      phase: "first_arc",
      slot: 10,
      time: "bris − 2 min",
      title: "Sandek holds baby in lap on cushion · blessing said",
      vendor: "mohel",
    },
    {
      key: "bris_circumcision",
      phase: "anchor_moment",
      slot: 10,
      time: "bris + 0",
      title: "BRIS · circumcision performed by mohel · covenant established",
      vendor: "mohel",
      note:
        "The ritual moment. Quick + professional. Father typically recites the " +
        "blessing 'l'hachniso bivrito shel Avraham avinu' (to bring him into " +
        "the covenant of Abraham).",
    },
    {
      key: "hebrew_naming_announced",
      phase: "anchor_moment",
      slot: 20,
      time: "bris + 2 min",
      title: "Hebrew name formally announced · 'And his name in Israel shall be called...'",
    },
    {
      key: "blessings_kiddush",
      phase: "transition",
      slot: 10,
      time: "bris + 5 min",
      title: "Closing blessings + kiddush over wine · baby returned to mother",
    },
    {
      key: "seudat_mitzvah",
      phase: "continuation_arc",
      slot: 10,
      time: "bris + 30 min",
      title: "SEUDAT MITZVAH · festive meal · bagels + lox + cake · sponsor blesses",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "bris + 2 h",
      title: "Guests depart · informal close",
    },
  ],
};

export default britMilah;
