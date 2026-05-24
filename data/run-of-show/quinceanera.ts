// data/run-of-show/quinceanera.ts
//
// Quinceañera — Run of Show
//
// Source prose: product/run-of-show/cultural/quinceanera.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md
//   Coming-of-age tradition extensions — quinceañera entries cover
//   parish_prep_classes, madrinas/padrinos, vals choreography, ultima
//   muneca, shoe change, tiara presentation.
//
// Time format: dual anchor — "Mass" for church beats, "vals" for the
// reception ritual cluster. The vals anchor is the cultural heart of
// the reception (última muñeca → shoe change → vals → tiara). Reception
// beats use either "reception start + N" or "vals − N" / "vals + N"
// depending on which is more local to the beat.
//
// Anchors:
//   Primary (cultural): the ritual cluster — última muñeca → shoes →
//     vals. Multi-step block, not a single moment.
//   Secondary (sacramental): Misa de Acción de Gracias earlier in the day.
//
// Cross-link table from the prose recipe used heavily for slot ordering.

import type { RoSRecipe } from "./types";

const quinceanera: RoSRecipe = {
  key: "quinceanera",
  labelEn: "Quinceañera",
  labelEs: "Quinceañera",
  eventType: "social",
  eventSubtypes: ["quinceanera"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging (D-1) ─────────────────────────────────────
    {
      key: "dress_alterations_final",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-1",
      title: "Dress alterations confirmed final",
    },
    {
      key: "padrino_de_pastel_baker_coord",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-1",
      title: "Padrino de pastel coordinates next-day cake delivery with baker",
      vendor: "baker",
    },
    {
      key: "choreographer_final_rehearsal",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1 · evening",
      title: "Choreographer runs final court rehearsal",
      vendor: "choreographer",
      note:
        "Most common stress point — the vals choreography either holds together " +
        "or doesn't. If the court can't do it cleanly D-1, simplify the " +
        "choreography that night; don't try to fix it on the day.",
    },
    {
      key: "mariachi_confirmed_both_locations",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-1",
      title: "Mariachi confirmed for church + reception (if separate)",
      vendor: "mariachi",
    },

    // ─── load_in (morning of) ──────────────────────────────────────
    {
      key: "florist_to_prep_location",
      phase: "load_in",
      slot: 10,
      time: "Mass − 5 h",
      title: "Florist delivers bouquet to family prep location",
      vendor: "florist",
    },
    {
      key: "reception_venue_decor_load_in",
      phase: "load_in",
      slot: 20,
      time: "Mass − 4 h",
      title: "Reception centerpieces + decor delivered to venue",
      vendor: "florist",
    },

    // ─── vip_arrivals (morning prep) ───────────────────────────────
    {
      key: "quinceanera_and_damas_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "Mass − 5 h",
      title: "Quinceañera + damas hair + makeup together · 4–6 hours for full court",
      vendor: "hair / makeup",
      note:
        "Hospitality moment, not a vendor-driven one. Family bonding before " +
        "the day's formal arc begins.",
    },
    {
      key: "photographer_arrives_prep",
      phase: "vip_arrivals",
      slot: 20,
      time: "Mass − 90 min",
      title: "Photographer arrives for getting-ready set · 90 min minimum",
      vendor: "photographer",
    },

    // ─── guest_arrivals (church) ───────────────────────────────────
    {
      key: "family_arrives_church",
      phase: "guest_arrivals",
      slot: 10,
      time: "Mass − 30 min",
      title: "Family arrives at parish · guests seat",
      note:
        "Quinceañera enters with father at start of Mass.",
    },

    // ─── opening_moment (Mass) ─────────────────────────────────────
    {
      key: "misa_de_accion_de_gracias_begins",
      phase: "opening_moment",
      slot: 10,
      time: "Mass + 0",
      title: "Misa de Acción de Gracias begins · quinceañera processional",
      vendor: "parish priest",
      note:
        "Mass typically 11 AM, 1 PM, or 2 PM depending on parish slot.",
    },

    // ─── first_arc (Mass + post-Mass church side) ──────────────────
    {
      key: "mass_celebration",
      phase: "first_arc",
      slot: 10,
      time: "Mass + 20 min",
      title: "Mass · 60–90 min · bouquet offered to Virgin Mary on altar",
      vendor: "parish priest",
      note:
        "Parish often has rules about the bouquet (some require it remain on " +
        "the altar as a Marian offering — clarify with liturgist when booking).",
    },
    {
      key: "church_family_photos",
      phase: "first_arc",
      slot: 20,
      time: "Mass + 75 min",
      title: "Family photos at altar + on church steps",
      vendor: "photographer",
    },
    {
      key: "transit_to_reception",
      phase: "first_arc",
      slot: 30,
      time: "Mass + 90 min",
      title: "Transit to reception venue · 90-min buffer if >15 min away",
      note:
        "Guests need to relocate too and they'll be slower than the family. " +
        "Real transit window prevents cascade into vals time.",
    },

    // ─── transition (cocktail at reception + grand entrance) ───────
    {
      key: "cocktail_arrival_at_reception",
      phase: "transition",
      slot: 10,
      time: "Mass + 2 h",
      title: "Cocktail at reception · mariachi often plays here · padrinos seat",
      vendor: "mariachi",
      note:
        "Position mariachi during cocktail (open room, lower noise floor) " +
        "rather than during dinner — reception venues often don't have " +
        "acoustics for live mariachi mid-meal.",
    },
    {
      key: "court_formal_portraits",
      phase: "transition",
      slot: 20,
      time: "Mass + 2 h",
      title: "Quinceañera + court formal portraits at venue",
      vendor: "photographer",
    },
    {
      key: "grand_entrance",
      phase: "transition",
      slot: 30,
      time: "reception start + 0",
      title: "Grand entrance · court paired in first · quinceañera with father last",
      vendor: "DJ",
      note:
        "High-camera moment. Confirm photographer positioned + DJ has right " +
        "track cued. Music pre-selected by choreographer.",
    },
    {
      key: "meal_service",
      phase: "transition",
      slot: 40,
      time: "reception start + 15 min",
      title: "Meal service · 2–3 courses · DJ takes over from mariachi",
      vendor: "caterer",
    },
    {
      key: "padrino_recognition_during_meal",
      phase: "transition",
      slot: 50,
      time: "reception start + 30 min",
      title: "Padrino recognition during meal · publicly named",
      vendor: "MC",
      note:
        "MUST happen during meal, not after open dance floor. Once dance " +
        "floor opens, attention is gone and padrinos feel slighted. Some " +
        "families do a 'padrino procession' (each called up); others let it " +
        "happen organically during toasts. Confirm with family + brief MC.",
    },

    // ─── anchor_moment (ritual cluster) ────────────────────────────
    {
      key: "ultima_muneca",
      phase: "anchor_moment",
      slot: 10,
      time: "vals − 10 min",
      title: "ÚLTIMA MUÑECA · father presents the last doll",
      note:
        "Symbolic farewell to childhood. Quinceañera hands the doll to a " +
        "younger sibling.",
    },
    {
      key: "shoe_change",
      phase: "anchor_moment",
      slot: 20,
      time: "vals − 5 min",
      title: "SHOE CHANGE · father/godfather places heels on quinceañera",
      vendor: "photographer",
      note:
        "Top-three shot of the night. Happens fast and low — easy to miss. " +
        "Brief photographer specifically. Symbolic step into womanhood.",
    },
    {
      key: "tiara_presentation",
      phase: "anchor_moment",
      slot: 30,
      time: "vals − 2 min",
      title: "TIARA · mother or madrina places tiara on quinceañera's head",
      note:
        "Often happens between doll and shoes, or right after vals — varies " +
        "by family. If photography missed in real-time it's hard to recover.",
    },
    {
      key: "vals_father_daughter",
      phase: "anchor_moment",
      slot: 40,
      time: "vals + 0",
      title: "VALS · father-daughter waltz first",
      vendor: "DJ",
    },
    {
      key: "vals_court_joins",
      phase: "anchor_moment",
      slot: 50,
      time: "vals + 2 min",
      title: "Court joins after first chorus · choreographed group dance",
      vendor: "choreographer",
      note:
        "Runs 3–5 min typically. If choreography falls apart, the quinceañera " +
        "leads — keep her smiling, photographer captures her face, not the " +
        "court's feet.",
    },

    // ─── continuation_arc (cake + open dance + hora loca) ──────────
    {
      key: "cake_cutting_padrino_de_pastel",
      phase: "continuation_arc",
      slot: 10,
      time: "reception start + 2 h",
      title: "Cake cutting · padrino de pastel recognized · quinceañera feeds father a bite",
      vendor: "baker",
    },
    {
      key: "toasts_continue",
      phase: "continuation_arc",
      slot: 20,
      time: "reception start + 2 h",
      title: "Toasts continue from godparents · priest if he stayed",
    },
    {
      key: "open_dance_floor",
      phase: "continuation_arc",
      slot: 30,
      time: "reception start + 2.5 h",
      title: "Open dance floor · mariachi closing set + DJ for dancing",
      vendor: "DJ",
    },
    {
      key: "money_dance",
      phase: "continuation_arc",
      slot: 40,
      time: "reception start + 3 h",
      title: "Money dance (dollar dance) · optional · contributes to college / honeymoon fund",
      note:
        "Guests pin bills to quinceañera's dress as they dance with her. " +
        "Some find it dated; others insist. Confirm in advance.",
    },
    {
      key: "hora_loca",
      phase: "continuation_arc",
      slot: 50,
      time: "reception start + 4 h",
      title: "Hora loca · costume hour with party favors · fast music · ~11 PM",
      note:
        "Modern late-night addition. Not traditional but increasingly common.",
    },

    // ─── send_off ──────────────────────────────────────────────────
    {
      key: "recordatorios_distributed",
      phase: "send_off",
      slot: 10,
      time: "reception start + 5 h",
      title: "Recordatorios (party favors) distributed as guests leave",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 20,
      time: "reception start + 5 h",
      title: "Some families end with formal send-off · others let party fade",
    },

    // ─── strike ────────────────────────────────────────────────────
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "reception start + 5 h",
      title: "Vendor breakdown begins as last guests leave",
    },
  ],
};

export default quinceanera;
