// data/run-of-show/debutante-ball.ts
// Debutante Ball
//
// V2 Tier 4. Formal coming-out ceremony for young women (typically 17-19),
// historically rooted in upper-class Anglo-American + Southern US traditions.
// Multiple variations: Black debutante balls (cotillions), Latino quinceañera-
// adjacent debutantes, traditional white-glove cotillions.
//
// Anchor: presentation ceremony — each debutante presented by her father
// (or escort) to the assembled guests with a deep curtsey.

import type { RoSRecipe } from "./types";

const debutanteBall: RoSRecipe = {
  key: "debutante_ball",
  labelEn: "Debutante Ball",
  labelEs: "Baile de debutantes",
  eventType: "social",
  eventSubtypes: ["debutante", "debutante_ball"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "committee_application",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-365",
      title: "Debutante committee application · formal acceptance 12-18 months out",
      note:
        "Some debutante balls (Cotillion Society, Mardi Gras krewes, historic " +
        "Black debutante balls like NAACP / Jack and Jill / Links) require " +
        "formal application + committee acceptance.",
    },
    {
      key: "etiquette_classes",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-180",
      title: "Etiquette + curtsey classes · multi-session",
      note:
        "Deep curtsey practice (Texas Dip / Saint James Bow / classic curtsey). " +
        "Posture, presentation form, ballroom dance basics.",
    },
    {
      key: "ball_gown_fittings",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-90",
      title: "White ball gown fittings · multiple sessions · long white gloves",
    },
    {
      key: "presentation_practice",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-30",
      title: "Presentation + curtsey practice · rehearsals at venue if possible",
    },
    {
      key: "venue_decor_setup",
      phase: "load_in",
      slot: 10,
      time: "ball − 6 h",
      title: "Venue decor setup · formal ballroom · floral arrangements + presentation runway",
      vendor: "florist",
    },
    {
      key: "catering_load_in",
      phase: "load_in",
      slot: 20,
      time: "ball − 5 h",
      title: "Catering load-in · formal multi-course service",
      vendor: "caterer",
    },
    {
      key: "debutante_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "ball − 3 h",
      title: "Debutante + escort prep · hair styled up · gown + gloves · escort in white tie or military uniform",
      vendor: "hair / makeup",
    },
    {
      key: "guests_arrive_formal",
      phase: "guest_arrivals",
      slot: 10,
      time: "ball − 30 min",
      title: "Guests arrive in formal attire · cocktails + champagne reception",
    },
    {
      key: "mc_opens_ball",
      phase: "opening_moment",
      slot: 10,
      time: "ball + 0",
      title: "MC opens · ball committee chair welcomes",
      vendor: "MC",
    },
    {
      key: "debutantes_processional",
      phase: "first_arc",
      slot: 10,
      time: "ball + 10 min",
      title: "Debutantes processional · alphabetical or order-by-committee · escorted by fathers",
    },
    {
      key: "presentation_ceremony",
      phase: "anchor_moment",
      slot: 10,
      time: "ball + 25 min",
      title: "PRESENTATION CEREMONY · each debutante presented + executes deep curtsey",
      note:
        "Each debutante's name + family + accomplishments announced. She " +
        "executes the practiced curtsey to the assembled guests. Photographed " +
        "individually as the centerpiece moment.",
    },
    {
      key: "father_daughter_waltz",
      phase: "anchor_moment",
      slot: 20,
      time: "ball + 60 min",
      title: "FATHER-DAUGHTER WALTZ · each debutante dances with her father (or escort)",
    },
    {
      key: "debutante_court_dance",
      phase: "transition",
      slot: 10,
      time: "ball + 90 min",
      title: "Debutante court dance · all debutantes + escorts choreographed group dance",
    },
    {
      key: "formal_dinner",
      phase: "continuation_arc",
      slot: 10,
      time: "ball + 2 h",
      title: "Formal seated dinner · multi-course",
      vendor: "caterer",
    },
    {
      key: "open_dance_floor",
      phase: "continuation_arc",
      slot: 20,
      time: "ball + 3.5 h",
      title: "Open dance floor · live orchestra or band · all guests join",
      vendor: "live orchestra or band",
    },
    {
      key: "midnight_close",
      phase: "send_off",
      slot: 10,
      time: "ball + 5 h",
      title: "Formal close · midnight typical · receiving line",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "ball + 6 h",
      title: "Vendor breakdown",
    },
  ],
};

export default debutanteBall;
