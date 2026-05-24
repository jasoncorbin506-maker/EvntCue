// data/run-of-show/upanayanam.ts
// Hindu Upanayanam (Sacred Thread Ceremony)
//
// V2 Tier 4. Coming-of-age ceremony for Hindu Brahmin boys (typically 7-12),
// initiating them into Vedic study. The sacred thread (yajnopavita / janeu)
// is invested in a ritual fire ceremony conducted by a pandit.
//
// Source: cultural-research/coming-of-age/upanayanam.md + mapping.
// Anchor: sacred thread investiture inside muhurat window.

import type { RoSRecipe } from "./types";

const upanayanam: RoSRecipe = {
  key: "upanayanam",
  labelEn: "Upanayanam (Sacred Thread Ceremony)",
  labelEs: "Upanayanam (ceremonia del cordón sagrado)",
  eventType: "social",
  eventSubtypes: ["upanayanam"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "muhurat_selection",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-180",
      title: "Muhurat selection · pandit calculates auspicious date from boy's birth chart",
      vendor: "pandit",
    },
    {
      key: "tonsure_ceremony",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-1",
      title: "TONSURE · head-shaving · traditionally day before",
    },
    {
      key: "homa_setup",
      phase: "load_in",
      slot: 10,
      time: "muhurat − 3 h",
      title: "Pandit prepares homa (sacred fire) materials · agni + ghee + samidha (wood)",
      vendor: "pandit",
    },
    {
      key: "satvik_caterer_load_in",
      phase: "load_in",
      slot: 20,
      time: "muhurat − 4 h",
      title: "Satvik / pure-veg caterer load-in for feast",
      vendor: "caterer",
    },
    {
      key: "boy_dressed_traditional",
      phase: "vip_arrivals",
      slot: 10,
      time: "muhurat − 2 h",
      title: "Boy dressed in dhoti + angavastram · family in traditional attire",
    },
    {
      key: "guests_arrive",
      phase: "guest_arrivals",
      slot: 10,
      time: "muhurat − 30 min",
      title: "Family + guests assemble around homa pit",
    },
    {
      key: "ganesh_puja",
      phase: "opening_moment",
      slot: 10,
      time: "muhurat − 20 min",
      title: "Ganesh puja invocation · removing obstacles",
      vendor: "pandit",
    },
    {
      key: "homa_lit",
      phase: "first_arc",
      slot: 10,
      time: "muhurat − 10 min",
      title: "HOMA · sacred fire lit · Vedic mantras chanted",
      vendor: "pandit",
    },
    {
      key: "sacred_thread_investiture",
      phase: "anchor_moment",
      slot: 10,
      time: "muhurat + 0",
      title: "YAJNOPAVITA · sacred thread placed across boy's shoulder · gayatri mantra taught",
      vendor: "pandit",
      note:
        "The ritual heart of Upanayanam. Boy formally initiated into Vedic study. " +
        "Father whispers Gayatri Mantra into boy's ear.",
    },
    {
      key: "bhiksha_alms",
      phase: "anchor_moment",
      slot: 20,
      time: "muhurat + 15 min",
      title: "BHIKSHA · boy ceremonially asks for alms from elders · received in cloth bag",
      note:
        "Symbolizes humility + dependence on community. Elders give rice + small " +
        "gifts as the boy circles the room.",
    },
    {
      key: "family_blessings",
      phase: "transition",
      slot: 10,
      time: "muhurat + 30 min",
      title: "Family blessings · elders bless boy with akshata (turmeric rice)",
    },
    {
      key: "feast",
      phase: "continuation_arc",
      slot: 10,
      time: "muhurat + 60 min",
      title: "Vegetarian feast · banana leaf service · families gather",
      vendor: "caterer",
    },
    {
      key: "guests_depart",
      phase: "send_off",
      slot: 10,
      time: "muhurat + 3 h",
      title: "Guests depart · informal close",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "muhurat + 4 h",
      title: "Vendor breakdown · homa pit safely extinguished",
    },
  ],
};

export default upanayanam;
