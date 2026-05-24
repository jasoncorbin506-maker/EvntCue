// data/run-of-show/sweet-sixteen.ts
// Sweet Sixteen
//
// V2 Tier 4. Western secular coming-of-age party for 16-year-olds (often
// for girls; "Sweet 16" branding; some boys host as well). Lighter ritual
// structure than quinceañera or bar/bat mitzvah — driven by theme + party.
//
// Anchor: grand entrance + first dance (often with father).

import type { RoSRecipe } from "./types";

const sweetSixteen: RoSRecipe = {
  key: "sweet_sixteen",
  labelEn: "Sweet Sixteen",
  labelEs: "Dulces dieciséis",
  eventType: "social",
  // CC fix 2026-05-24 (session 18y V2 integration) — budget-presets.ts uses
  // canonical key "sweet_16" (matching SOCIAL_SUBTYPES_DATA), not
  // "sweet_sixteen". Recipe re-keyed to dispatch.
  eventSubtypes: ["sweet_16"],
  items: [
    {
      key: "theme_locked",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-240",
      title: "THEME locked · drives venue + dress + decor + entrance",
      note:
        "Themed Sweet 16s are dominant. Common themes: Hollywood / Paris / " +
        "Vegas / masquerade / specific color palette / fandom-based.",
    },
    {
      key: "venue_booked",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-180",
      title: "Venue booked · banquet hall / restaurant / private home / themed space",
    },
    {
      key: "dress_acquired",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-90",
      title: "Dress acquired · theme-coordinated · sometimes outfit changes",
    },
    {
      key: "entrance_choreography",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-60",
      title: "Themed entrance choreographed (modern addition)",
      note:
        "Increasingly common — birthday person enters to specific song with " +
        "court of friends in coordinated movements.",
    },
    {
      key: "venue_decor_setup",
      phase: "load_in",
      slot: 10,
      time: "party − 4 h",
      title: "Venue decor setup · backdrop + step-and-repeat + balloons + themed details",
    },
    {
      key: "catering_load_in",
      phase: "load_in",
      slot: 20,
      time: "party − 3 h",
      title: "Catering load-in · cake delivered",
      vendor: "caterer + baker",
    },
    {
      key: "birthday_person_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "party − 3 h",
      title: "Birthday person + court (close friends) hair + makeup",
      vendor: "hair / makeup",
    },
    {
      key: "guests_arrive",
      phase: "guest_arrivals",
      slot: 10,
      time: "party − 15 min",
      title: "Guests arrive · check-in · photo wall · mocktails / sodas",
    },
    {
      key: "mc_opens",
      phase: "opening_moment",
      slot: 10,
      time: "party + 0",
      title: "MC welcomes guests · pre-entrance announcement",
      vendor: "MC",
    },
    {
      key: "grand_entrance",
      phase: "anchor_moment",
      slot: 10,
      time: "party + 5 min",
      title: "GRAND ENTRANCE · birthday person + court enter to theme song",
      note:
        "High-camera moment. Choreographed entrance increasingly common.",
    },
    {
      key: "father_daughter_first_dance",
      phase: "anchor_moment",
      slot: 20,
      time: "party + 10 min",
      title: "First dance (often father-daughter)",
    },
    {
      key: "welcome_speeches",
      phase: "first_arc",
      slot: 10,
      time: "party + 15 min",
      title: "Parent welcome speeches · brief, emotional",
    },
    {
      key: "dinner",
      phase: "continuation_arc",
      slot: 10,
      time: "party + 30 min",
      title: "Dinner served · buffet or plated",
      vendor: "caterer",
    },
    {
      key: "cake_cutting",
      phase: "continuation_arc",
      slot: 20,
      time: "party + 90 min",
      title: "Cake cutting · 'Happy Birthday' sung · candle blow-out",
    },
    {
      key: "open_dance_floor",
      phase: "continuation_arc",
      slot: 30,
      time: "party + 105 min",
      title: "DJ-driven open dance floor · teen pop / hip-hop / TikTok favorites",
      vendor: "DJ",
    },
    {
      key: "photo_booth_active",
      phase: "continuation_arc",
      slot: 40,
      time: "party + 2 h",
      title: "Photo booth active · custom prints with party theme",
    },
    {
      key: "party_close",
      phase: "send_off",
      slot: 10,
      time: "party + 4 h",
      title: "Party closes · favors distributed as guests depart",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "party + 5 h",
      title: "Vendor breakdown",
    },
  ],
};

export default sweetSixteen;
