// data/run-of-show/yoruba-wedding.ts
//
// Yoruba Wedding (Igbeyawo + White Wedding) — Run of Show
//
// Source: cultural-research/weddings/yoruba-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Yoruba/Igbo wedding table
//   - eru_iyawo_bride_price (relative, -3 months)
//   - introduction_ceremony (relative, -2 months)
//   - traditional_wedding (relative, 0) — Igbeyawo
//   - engagement_proverbs_ritual (absolute — specific moment in traditional)
//   - white_wedding (relative, +7 days)
//   - money_spraying_dance (absolute — reception centerpiece)
//
// V2 Tier 2 recipe. Two-event sequence: traditional Igbeyawo + Christian
// or Muslim white wedding. Driven by alaga ijoko + alaga iduro (the two
// masters of ceremony, central to the cultural wedding).
//
// Anchor: the bride's veiled entrance + finding the groom + kneeling
// before him in front of the gathered community. Public consent ritual.

import type { RoSRecipe } from "./types";

const yorubaWedding: RoSRecipe = {
  key: "yoruba_wedding",
  labelEn: "Yoruba Wedding (Igbeyawo)",
  labelEs: "Boda yoruba (Igbeyawo)",
  eventType: "wedding",
  // CC fix 2026-05-24 (session 18y V2 integration) — budget-presets.ts has
  // generic `nigerian` only (no Yoruba/Igbo/Hausa regional split). Yoruba
  // is the modal DFW Nigerian wedding shape, so this recipe claims the
  // generic `nigerian` key in addition to `yoruba`. Igbo recipe stays
  // ["igbo"]-only — falls to universal_fallback for generic `nigerian`
  // dispatches (acceptable; user gets generic skeleton until they specify).
  eventSubtypes: ["nigerian", "yoruba"],
  items: [
    {
      key: "introduction_ceremony",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-60",
      title: "MỌ MÍ KÍ MỌ Ẹ · introduction · family-to-family formal first meeting",
    },
    {
      key: "proposal_acceptance_letters",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-30",
      title: "Proposal letter from groom's family · acceptance letter from bride's family",
      note:
        "Read aloud at traditional wedding by alaga ijoko / alaga iduro with " +
        "extensive commentary.",
    },
    {
      key: "aso_oke_coordinated",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-14",
      title: "Aso oke coordinated · bride's + groom's family colors agreed + tailored",
      vendor: "Aso oke coordinator",
      note:
        "Handwoven traditional Yoruba fabric in matching family-coordinated colors. " +
        "Both families wear coordinated aso oke colors (one set per family). " +
        "Tailoring delays are the most common day-of disaster.",
    },
    {
      key: "eru_iyawo_assembled",
      phase: "load_in",
      slot: 10,
      time: "Igbeyawo − 1 day",
      title: "ERU IYAWO assembled · drinks + kola nuts + fruits + salt + sugar + bibles/Qurans + fabrics + jewelry + money",
      note:
        "Formal gift list groom's family must bring. Sometimes a goat or live " +
        "animal. Bride's family inspects + accepts each item with public commentary.",
    },
    {
      key: "venue_seating_setup",
      phase: "load_in",
      slot: 20,
      time: "Igbeyawo − 3 h",
      title: "Venue setup · bride's family seated one side · groom's family other · alaga in middle",
    },
    {
      key: "bride_gele_tying",
      phase: "vip_arrivals",
      slot: 10,
      time: "Igbeyawo − 2 h",
      title: "Bride styled in iro + buba · gele tied by specialist (elaborate folded head wrap)",
      vendor: "Gele tying specialist",
      note:
        "Bride wears iro (wrapper) + buba (blouse) + gele (large folded head " +
        "wrap). Groom in agbada + buba + sokoto + fila.",
    },
    {
      key: "groom_family_arrives_eru_iyawo",
      phase: "guest_arrivals",
      slot: 10,
      time: "Igbeyawo − 30 min",
      title: "Groom + family arrive at venue · presented with eru iyawo gifts",
    },
    {
      key: "alaga_negotiation_theater",
      phase: "opening_moment",
      slot: 10,
      time: "Igbeyawo + 0",
      title: "ALAGA IDURO opens for groom's family · ALAGA IJOKO responds for bride's · negotiation theater begins",
      vendor: "Alaga Ijoko + Alaga Iduro",
      note:
        "Most expensive vendors for the Yoruba wedding ($500-$3,000 each). They " +
        "drive the entire cultural ceremony through humor, song, and Yoruba " +
        "proverbs. If the alaga is weak, the entire event suffers.",
    },
    {
      key: "proposal_acceptance_letters_read",
      phase: "first_arc",
      slot: 10,
      time: "Igbeyawo + 10 min",
      title: "Proposal + acceptance letters read aloud · alaga commentary",
    },
    {
      key: "eru_iyawo_items_presented",
      phase: "first_arc",
      slot: 20,
      time: "Igbeyawo + 25 min",
      title: "Eru iyawo items presented + inspected + publicly accepted",
    },
    {
      key: "prostration_grooms_family",
      phase: "first_arc",
      slot: 30,
      time: "Igbeyawo + 45 min",
      title: "PROSTRATION · groom + male family flat on floor before bride's family · women curtsy",
      note:
        "Non-negotiable demonstration of humility and respect. Photographed.",
    },
    {
      key: "brides_family_questions_groom",
      phase: "first_arc",
      slot: 40,
      time: "Igbeyawo + 55 min",
      title: "Bride's family asks groom questions · blesses him",
    },
    {
      key: "brides_veiled_entrance",
      phase: "anchor_moment",
      slot: 10,
      time: "Igbeyawo + 70 min",
      title: "BRIDE ENTERS VEILED + dancing with bridesmaids",
      note:
        "Alaga calls her forward; she circles, sometimes deliberately taking time " +
        "to 'find' her husband among seated men. Cultural moment of truth.",
    },
    {
      key: "bride_finds_groom_kneels",
      phase: "anchor_moment",
      slot: 20,
      time: "Igbeyawo + 75 min",
      title: "Bride finds groom · kneels before him · accepts",
      note:
        "The photographed marriage moment. Public consent ritual.",
    },
    {
      key: "father_gives_bride_to_groom",
      phase: "anchor_moment",
      slot: 30,
      time: "Igbeyawo + 80 min",
      title: "Bride's father formally hands bride to groom · sometimes with Bible / Quran",
    },
    {
      key: "family_elders_extended_blessings",
      phase: "transition",
      slot: 10,
      time: "Igbeyawo + 90 min",
      title: "Both families' elders bless couple at length · prayers · proverbs",
    },
    {
      key: "couple_dance_money_spraying",
      phase: "continuation_arc",
      slot: 10,
      time: "Igbeyawo + 110 min",
      title: "COUPLE DANCES · guests 'spray' money on them (Naira or USD)",
      note:
        "Both cultural ritual and meaningful financial event. Money lands on " +
        "floor; bridesmaids manage collection. Total can run into thousands " +
        "at large weddings.",
    },
    {
      key: "talking_drummers_throughout",
      phase: "continuation_arc",
      slot: 20,
      time: "Igbeyawo + 2 h",
      title: "Talking drummers (gbedu + dundun + sekere) · Fuji / Juju music",
      vendor: "talking drummers",
    },
    {
      key: "nigerian_banquet",
      phase: "continuation_arc",
      slot: 30,
      time: "Igbeyawo + 3 h",
      title: "Nigerian banquet · jollof rice + suya + pepper soup + asun + moin moin + plantain",
      vendor: "Yoruba / Nigerian caterer",
    },
    {
      key: "afrobeats_dancing",
      phase: "continuation_arc",
      slot: 40,
      time: "Igbeyawo + 4 h",
      title: "Afrobeats DJ · Fuji + Juju + Highlife + Naija pop + Western pop",
      vendor: "Afrobeats DJ",
    },
    {
      key: "traditional_wedding_close",
      phase: "send_off",
      slot: 10,
      time: "Igbeyawo + 6 h",
      title: "Traditional wedding concludes · guests depart",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "Igbeyawo + 6 h",
      title: "Vendor breakdown · cash counted by bridesmaids",
    },
    {
      key: "white_wedding_next_day",
      phase: "day_after",
      slot: 10,
      time: "D+1 OR D+7",
      title: "WHITE WEDDING · Christian (Anglican / Catholic / Pentecostal) or Muslim ceremony",
      vendor: "Christian / Muslim officiant",
      note:
        "Standard Western ceremony form. Reception with Yoruba food, music, " +
        "dancing — similar pattern to the traditional reception. Often the " +
        "next day or the next weekend.",
    },
  ],
};

export default yorubaWedding;
