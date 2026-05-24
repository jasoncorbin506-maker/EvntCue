// data/run-of-show/navratri-garba.ts
//
// Navratri / Garba — Run of Show (single Garba night)
//
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Navratri/Garba
// Source: cultural-research/religious-holidays/navratri-garba.md
//
// V2 Tier 3. 9-night Hindu festival worshiping Goddess Durga; Garba is the
// signature dance held each night. This recipe covers hosting a single
// Garba night. Communities hold larger venue-based Garbas; families host
// smaller home-based versions.
//
// Anchor: Garba dance circle around the central deity / altar.

import type { RoSRecipe } from "./types";

const navratriGarba: RoSRecipe = {
  key: "navratri_garba",
  labelEn: "Navratri Garba",
  labelEs: "Navratri Garba",
  eventType: "public_cultural",
  eventSubtypes: ["navratri", "garba"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "garba_outfit_acquisition",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-14",
      title: "Chaniya choli (Gujarati flared skirt + blouse) acquired · rented or purchased",
      note:
        "Women wear chaniya choli; men wear kediyu (Gujarati short kurta) + " +
        "dhoti or pajama. Mirror-work embroidery characteristic.",
    },
    {
      key: "dandiya_sticks",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-7",
      title: "Dandiya sticks acquired · decorated wooden sticks for Raas Dandiya",
    },
    {
      key: "venue_decor_setup",
      phase: "load_in",
      slot: 10,
      time: "Garba − 4 h",
      title: "Venue decor · central altar with Durga / Garbi (clay pot lamp) · mandala floor design",
    },
    {
      key: "food_setup_gujarati",
      phase: "load_in",
      slot: 20,
      time: "Garba − 2 h",
      title: "Gujarati food setup · fafda + jalebi + dhokla + thepla · chai station",
      vendor: "Gujarati caterer",
    },
    {
      key: "family_dressed_traditional",
      phase: "vip_arrivals",
      slot: 10,
      time: "Garba − 90 min",
      title: "Family in chaniya choli / kediyu · jewelry + mirror work + bindis",
    },
    {
      key: "guests_arrive",
      phase: "guest_arrivals",
      slot: 10,
      time: "Garba − 30 min",
      title: "Guests arrive · greeted with namaste · light snacks served",
    },
    {
      key: "aarti_to_durga",
      phase: "opening_moment",
      slot: 10,
      time: "Garba − 10 min",
      title: "Aarti performed to Goddess Durga · invocation",
    },
    {
      key: "garba_dance_circles",
      phase: "anchor_moment",
      slot: 10,
      time: "Garba + 0",
      title: "GARBA dance · concentric circles around the central altar · clockwise motion",
      note:
        "Begins slowly with traditional steps; energy builds. Music led by " +
        "live or recorded Gujarati folk songs + modern Garba pop.",
    },
    {
      key: "raas_dandiya",
      phase: "anchor_moment",
      slot: 20,
      time: "Garba + 45 min",
      title: "RAAS DANDIYA · partner dance with sticks · paired choreographed movements",
      note:
        "Faster + more athletic than Garba. Couples (or pairs) exchange sticks " +
        "to rhythm. Highly photographed; signature Navratri visual.",
    },
    {
      key: "dance_continues_high_energy",
      phase: "continuation_arc",
      slot: 10,
      time: "Garba + 2 h",
      title: "Dance continues · modern Garba remixes · younger generation drives energy",
      vendor: "Garba DJ",
    },
    {
      key: "feast_break",
      phase: "continuation_arc",
      slot: 20,
      time: "Garba + 3 h",
      title: "Feast break · Gujarati buffet · chai + sweets",
    },
    {
      key: "dance_resumes_until_late",
      phase: "continuation_arc",
      slot: 30,
      time: "Garba + 4 h",
      title: "Dance resumes · often runs past midnight",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "Garba + 6 h",
      title: "Guests depart · multi-night Garba pattern continues across 9 nights",
    },
  ],
};

export default navratriGarba;
