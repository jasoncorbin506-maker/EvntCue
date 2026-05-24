// data/run-of-show/greek-orthodox-wedding.ts
//
// Greek Orthodox Wedding — Run of Show
//
// Source: cultural-research/weddings/greek-orthodox-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md notes
//   "Shared shape: priest-officiated, fasting-period restrictions on date
//   selection (Rule 4 — the date itself is constrained by the religious
//   calendar). The wedding date IS the absolute anchor; ceremony elements
//   are absolute within. Use the Catholic mapping as the base + override."
//
// V2 Tier 2 recipe. Also covers (with denomination override) Russian,
// Serbian, Romanian, Antiochian, OCA Orthodox weddings — same liturgy,
// regional language and music variations.
//
// Anchor: crowning with stefana (the moment the couple becomes king and
// queen of their household). Everything done in threes — three ring
// exchanges, three crown exchanges, three sips, three circuits.

import type { RoSRecipe } from "./types";

const greekOrthodoxWedding: RoSRecipe = {
  key: "greek_orthodox_wedding",
  labelEn: "Greek Orthodox Wedding",
  labelEs: "Boda ortodoxa griega",
  eventType: "wedding",
  eventSubtypes: ["greek_orthodox"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "fasting_calendar_check",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-365 (date selection)",
      title: "Confirm date avoids Great Lent + Apostles' Fast + Dormition Fast + Nativity Fast + feast days",
      vendor: "parish priest",
      note:
        "Orthodox fasting calendar is the most restrictive of any tradition — " +
        "combined fast periods eliminate ~50% of the year for observant couples.",
    },
    {
      key: "stefana_purchased",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-30",
      title: "STEFANA (wedding crowns) purchased · often provided as koumbaro/koumbara gift",
      note:
        "Crowns may be leaves, flowers, or precious metal, connected by white " +
        "ribbon. $50-$500. Koumbaro / koumbara (godparent of the wedding) " +
        "traditionally provides them.",
    },
    {
      key: "krevvati_optional",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1 · evening",
      title: "KREVVATI (optional) · friends decorate marital bed with rose petals + coins + rice",
      note:
        "Blessing the couple's future home. Not all families observe.",
    },
    {
      key: "iconostasis_florist",
      phase: "load_in",
      slot: 10,
      time: "ceremony − 4 h",
      title: "Iconostasis / sanctuary florist · church wedding-day floral arrangements",
      vendor: "florist",
    },
    {
      key: "bride_groom_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "ceremony − 3 h",
      title: "Bride + groom prep separately · koumbaro/koumbara arrive with stefana + candles",
      vendor: "hair / makeup",
    },
    {
      key: "guests_arrive_church",
      phase: "guest_arrivals",
      slot: 10,
      time: "ceremony − 20 min",
      title: "Guests arrive at church · seat near iconostasis",
    },
    {
      key: "ceremony_opens",
      phase: "opening_moment",
      slot: 10,
      time: "ceremony + 0",
      title: "Couple stands before iconostasis · wedding table prepared",
      vendor: "Greek Orthodox priest",
    },
    {
      key: "service_of_betrothal_rings",
      phase: "first_arc",
      slot: 10,
      time: "ceremony + 5 min",
      title: "SERVICE OF BETROTHAL · priest blesses rings · koumbaro exchanges rings 3 times",
      vendor: "koumbaro / koumbara",
      note:
        "The number three references the Holy Trinity and recurs throughout. " +
        "Three ring exchanges; three crown exchanges; three sips; three circuits.",
    },
    {
      key: "service_of_crowning_stefana",
      phase: "anchor_moment",
      slot: 10,
      time: "ceremony + 20 min",
      title: "SERVICE OF CROWNING · priest places stefana on couple's heads",
      vendor: "Greek Orthodox priest",
      note:
        "Marriage is constituted by the crowning (no spoken vows in Greek " +
        "Orthodox tradition). Crowns symbolize the couple as king and queen of " +
        "their new household + the sacrifice of married life.",
    },
    {
      key: "crowns_exchanged_three_times",
      phase: "anchor_moment",
      slot: 20,
      time: "ceremony + 23 min",
      title: "Koumbaro / koumbara exchanges crowns 3 times between bride and groom",
    },
    {
      key: "common_cup",
      phase: "anchor_moment",
      slot: 30,
      time: "ceremony + 32 min",
      title: "COMMON CUP · priest offers blessed wine · couple takes 3 sips each",
      note:
        "Symbolizes shared life + shared joys and sorrows.",
    },
    {
      key: "dance_of_isaiah",
      phase: "anchor_moment",
      slot: 40,
      time: "ceremony + 38 min",
      title: "DANCE OF ISAIAH · priest leads couple 3 times around wedding table · hymns sung",
      note:
        "First steps together following the Gospel. Priest holds Gospels + sings.",
    },
    {
      key: "removal_of_crowns",
      phase: "anchor_moment",
      slot: 50,
      time: "ceremony + 50 min",
      title: "Removal of crowns · priest prays for couple",
      note:
        "Crowns sometimes kept at church (for future memorial / Trisagion); " +
        "sometimes the couple takes them home as relics.",
    },
    {
      key: "final_blessings_dismissal",
      phase: "transition",
      slot: 10,
      time: "ceremony + 55 min",
      title: "Final blessings + dismissal · group photos at church",
      vendor: "photographer",
    },
    {
      key: "procession_to_reception",
      phase: "transition",
      slot: 20,
      time: "ceremony + 75 min",
      title: "Procession to reception venue · car convoy honking + traditional music",
    },
    {
      key: "reception_begins",
      phase: "continuation_arc",
      slot: 10,
      time: "reception start + 0",
      title: "Reception · koufeta favors distributed (odd-numbered sugared almonds)",
      vendor: "Greek caterer",
      note:
        "5 koufeta = health, wealth, happiness, fertility, long life. Odd because " +
        "indivisible — signifies the couple's indivisibility.",
    },
    {
      key: "greek_banquet",
      phase: "continuation_arc",
      slot: 20,
      time: "reception start + 30 min",
      title: "Greek banquet · souvlaki + lamb + moussaka + spanakopita + dolmades + baklava",
      vendor: "Greek caterer",
    },
    {
      key: "greek_traditional_dancing",
      phase: "continuation_arc",
      slot: 30,
      time: "reception start + 2 h",
      title: "Greek dancing · kalamatianos + syrtos + hasapiko + tsamiko · bouzouki + clarinet",
      vendor: "Greek live band or DJ",
      note:
        "Family dance circles central. Diaspora practice often includes plate " +
        "breaking / petal throwing / 'opa!' — more pronounced in Greek-American " +
        "weddings than in Athens itself.",
    },
    {
      key: "cake_cutting",
      phase: "continuation_arc",
      slot: 40,
      time: "reception start + 3 h",
      title: "Cake cutting",
    },
    {
      key: "guests_depart",
      phase: "send_off",
      slot: 10,
      time: "reception start + 5 h",
      title: "Guests depart · informal close",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "reception start + 5 h",
      title: "Vendor breakdown",
    },
  ],
};

export default greekOrthodoxWedding;
