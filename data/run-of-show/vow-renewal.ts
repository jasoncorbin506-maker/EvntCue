// data/run-of-show/vow-renewal.ts
// Vow Renewal
//
// V2 Tier 5. Couple renews wedding vows after a meaningful interval
// (5/10/20+ years, after a health crisis, after rebuilding, or on a
// milestone anniversary). Lighter ritual structure than wedding — no
// legal element, but emotional + spiritual significance is real.
//
// Anchor: vow renewal ceremony — exchange of renewed vows (often modified
// to reflect years of lived experience).

import type { RoSRecipe } from "./types";

const vowRenewal: RoSRecipe = {
  key: "vow_renewal",
  labelEn: "Vow Renewal",
  labelEs: "Renovación de votos",
  eventType: "social",
  eventSubtypes: ["vow_renewal"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "officiant_arranged",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-90",
      title: "Officiant arranged · pastor / priest / rabbi / friend / family member",
      vendor: "officiant",
      note:
        "No legal element required, so officiant can be anyone the couple " +
        "chooses. Often a family member (adult child, sibling) for emotional " +
        "significance.",
    },
    {
      key: "venue_booked",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-90",
      title: "Venue booked · often more intimate than original wedding (beach, garden, home)",
    },
    {
      key: "new_vows_written",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-30",
      title: "New vows written · reflecting years of shared life + lessons",
      note:
        "Often the most meaningful part. Couples reflect on what marriage has " +
        "actually meant — sometimes painful, often grateful, always specific.",
    },
    {
      key: "attire_chosen",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-21",
      title: "Attire chosen · less formal than original wedding · couple's choice",
    },
    {
      key: "venue_setup",
      phase: "load_in",
      slot: 10,
      time: "ceremony − 2 h",
      title: "Venue setup · simple decor · floral arrangement",
      vendor: "florist",
    },
    {
      key: "catering_or_meal_prepared",
      phase: "load_in",
      slot: 20,
      time: "ceremony − 3 h",
      title: "Catering or meal prepared · often more casual than original wedding",
      vendor: "caterer",
    },
    {
      key: "couple_dressed",
      phase: "vip_arrivals",
      slot: 10,
      time: "ceremony − 60 min",
      title: "Couple dressed · sometimes rewearing wedding attire if it fits",
    },
    {
      key: "guests_arrive_intimate",
      phase: "guest_arrivals",
      slot: 10,
      time: "ceremony − 15 min",
      title: "Intimate guest list arrives · usually 20-80 close family + friends",
      note:
        "Vow renewals tend to be smaller than weddings. Closest family + " +
        "friends only — those who have witnessed the marriage along the way.",
    },
    {
      key: "officiant_welcomes",
      phase: "opening_moment",
      slot: 10,
      time: "ceremony + 0",
      title: "Officiant welcomes guests · reflects on the couple's journey",
      vendor: "officiant",
    },
    {
      key: "readings_optional",
      phase: "first_arc",
      slot: 10,
      time: "ceremony + 5 min",
      title: "Readings · scripture / poetry / personal essays from children",
    },
    {
      key: "officiants_reflection",
      phase: "first_arc",
      slot: 20,
      time: "ceremony + 15 min",
      title: "Officiant's brief reflection on marriage + the couple specifically",
    },
    {
      key: "vow_renewal",
      phase: "anchor_moment",
      slot: 10,
      time: "ceremony + 22 min",
      title: "VOW RENEWAL · couple exchanges renewed vows",
      note:
        "The emotional centerpiece. Vows often reflect specific shared " +
        "experiences — illness weathered, children raised, dreams chased + " +
        "abandoned + recovered.",
    },
    {
      key: "ring_blessing_or_new_ring",
      phase: "anchor_moment",
      slot: 20,
      time: "ceremony + 28 min",
      title: "Original rings re-blessed OR new bands exchanged",
    },
    {
      key: "officiant_blessing",
      phase: "anchor_moment",
      slot: 30,
      time: "ceremony + 32 min",
      title: "Officiant's final blessing · 'and the journey continues...'",
    },
    {
      key: "applause_embrace",
      phase: "transition",
      slot: 10,
      time: "ceremony + 35 min",
      title: "Applause + embraces from family + friends",
    },
    {
      key: "reception_intimate",
      phase: "continuation_arc",
      slot: 10,
      time: "ceremony + 60 min",
      title: "Reception · intimate dinner · toasts from children + close friends",
      vendor: "caterer",
    },
    {
      key: "dance_optional",
      phase: "continuation_arc",
      slot: 20,
      time: "ceremony + 2.5 h",
      title: "Music + dancing (optional) · couple's wedding song often replayed",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "ceremony + 4 h",
      title: "Informal close · guests depart",
    },
  ],
};

export default vowRenewal;
