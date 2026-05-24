// data/run-of-show/dia-de-los-muertos.ts
// Día de los Muertos (Day of the Dead)
//
// V2 Tier 5. Mexican holiday honoring deceased family members, observed
// Nov 1 (Día de los Inocentes — for children) + Nov 2 (Día de los
// Difuntos — for adults). Fixed-calendar event; the date IS the anchor.
// Family ofrenda (altar) built with photos, food, marigolds, candles to
// welcome the spirits of the deceased for their annual visit.
//
// SACRED RULE REMINDER: this is a celebration of deceased loved ones, not
// of death itself. Tone is joyful + remembering, not somber. But sacred
// dignity applies; no jokes about the dead.
//
// Anchor: Nov 1 morning + Nov 2 evening — the two days the spirits visit.

import type { RoSRecipe } from "./types";

const diaDeLosMuertos: RoSRecipe = {
  key: "dia_de_los_muertos",
  labelEn: "Día de los Muertos",
  labelEs: "Día de los Muertos",
  eventType: "public_cultural",
  eventSubtypes: ["dia_de_los_muertos", "day_of_the_dead"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "marigolds_purchased",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-14",
      title: "Cempasúchiles (marigolds) purchased · DFW Hispanic markets stock seasonally",
      note:
        "Marigolds' scent traditionally helps guide the spirits back. Petals " +
        "scattered from home entrance to altar to create a path.",
    },
    {
      key: "ofrenda_altar_construction",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-7",
      title: "OFRENDA ALTAR construction begins · multi-level altar at home",
      note:
        "Three levels traditional: top (deceased + saints), middle (food + " +
        "personal items), bottom (water + earth + offerings). Built up over " +
        "several days with family input.",
    },
    {
      key: "photos_personal_items_arranged",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-5",
      title: "Photos of deceased + personal items arranged on altar",
      note:
        "Items the deceased loved in life — favorite foods, drinks, hobbies " +
        "(guitar, books, sports memorabilia). Personal touches the spirit " +
        "would recognize.",
    },
    {
      key: "pan_de_muerto_baking",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-3",
      title: "Pan de Muerto baking · traditional sweet bread · often family activity",
    },
    {
      key: "favorite_foods_prepared",
      phase: "load_in",
      slot: 10,
      time: "D-1",
      title: "Favorite foods of deceased prepared · placed on altar Nov 1 morning",
      note:
        "Mole, tamales, sugar skulls (calaveras de azúcar), fruit, chocolate, " +
        "atole, hot chocolate. What the deceased loved in life.",
    },
    {
      key: "cemetery_visit_preparation",
      phase: "load_in",
      slot: 20,
      time: "D-1",
      title: "Graves cleaned + decorated · marigolds + candles + favorite items left",
      note:
        "In Mexico (and increasingly in DFW Hispanic neighborhoods), families " +
        "visit cemeteries to clean graves and decorate them. All-night vigils " +
        "(velación) at gravesite are traditional in some regions.",
    },
    {
      key: "candles_lit_nov_1_morning",
      phase: "opening_moment",
      slot: 10,
      time: "Nov 1 morning",
      title: "Candles lit at altar · path of marigold petals laid",
    },
    {
      key: "dia_de_los_inocentes",
      phase: "anchor_moment",
      slot: 10,
      time: "Nov 1 all day",
      title: "DÍA DE LOS INOCENTES · spirits of deceased children welcomed",
      note:
        "First day honors children who passed. Toys, candies, milk, and " +
        "smaller-portion foods placed on altar.",
    },
    {
      key: "family_gathers_storytelling",
      phase: "first_arc",
      slot: 10,
      time: "Nov 1 evening",
      title: "Family gathers at altar · storytelling about deceased · sharing memories",
      note:
        "Heart of the holiday. Not somber — joyful remembering. Stories the " +
        "deceased would laugh at; their favorite jokes; their best qualities. " +
        "Younger generation learns about ancestors they never met.",
    },
    {
      key: "dia_de_los_difuntos",
      phase: "anchor_moment",
      slot: 20,
      time: "Nov 2 all day",
      title: "DÍA DE LOS DIFUNTOS · spirits of deceased adults welcomed",
      note:
        "Second day honors adults. Adult favorite foods + drinks (mezcal, " +
        "tequila, pulque) placed on altar. The fuller celebration.",
    },
    {
      key: "cemetery_visit_nov_2",
      phase: "continuation_arc",
      slot: 10,
      time: "Nov 2 morning or afternoon",
      title: "Cemetery visit · family cleans graves + decorates · picnic at gravesite traditional",
      note:
        "Mexican tradition: families spend the day at the cemetery, sharing " +
        "meals near loved ones' graves. DFW Hispanic communities adapt — some " +
        "visit briefly + return home for evening gathering.",
    },
    {
      key: "all_souls_day_mass",
      phase: "continuation_arc",
      slot: 20,
      time: "Nov 2",
      title: "All Souls' Day Mass attended (Catholic observance)",
      vendor: "parish priest",
      note:
        "Hispanic Catholic parishes hold Mass for deceased. Names of the year's " +
        "deceased often read aloud.",
    },
    {
      key: "evening_altar_gathering",
      phase: "continuation_arc",
      slot: 30,
      time: "Nov 2 evening",
      title: "Evening at altar · final stories shared · spirits begin their return at midnight",
    },
    {
      key: "altar_left_through_nov_3",
      phase: "send_off",
      slot: 10,
      time: "Nov 3",
      title: "Altar left through Nov 3 · favorite foods consumed by family in following days",
      note:
        "Once spirits depart, the altar foods are consumed by the family — not " +
        "wasted. Symbolic communion with the deceased.",
    },
    {
      key: "altar_dismantled_respectfully",
      phase: "strike",
      slot: 10,
      time: "Nov 5-7",
      title: "Altar respectfully dismantled · photos returned to home displays",
    },
  ],
};

export default diaDeLosMuertos;
