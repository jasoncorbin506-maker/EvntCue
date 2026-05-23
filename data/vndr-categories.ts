/**
 * Vndr category taxonomy — single source of truth.
 *
 * Source: 02_Locked_Prototypes/Vndr/evntcue_vndr_freemium_v1.html Stage 1
 * (lines 1672–1683). Eight top-level service categories per Lock 14
 * (service-based, not cultural specialty — vendors author cultural-
 * specialty descriptors themselves in package copy, not as a tag taxonomy).
 *
 * Lock 14 amended 2026-05-23 (V-1b session): "Dessert & Bar" removed from
 * the Vndr taxonomy. Cake designers, bakers, dessert vendors, coffee
 * carts, mixologists, sommeliers, and late-night-snack vendors belong in
 * the Catr (caterer) portal — food and alcohol are food-service domains
 * with their own compliance gates (TABC, food handler, TX health code)
 * that Catr enforces as HARD gates per master spec §75, not soft gates
 * like Vndr. Carving them out here so the Vndr/Catr boundary is clean
 * in code before either portal sees real users.
 *
 * Display strings route through lib/labels/vendor-categories.ts per Lock 15
 * (DB enums + canonical keys → locale-aware UI strings).
 */

export const VNDR_CATEGORIES = [
  {
    key: "photo",
    labelEn: "Photography & Media",
    labelEs: "Fotografía y medios",
    subTypes: [
      "Photographer",
      "Videographer",
      "Content creator",
      "Drone operator",
      "Live streaming team",
    ],
  },
  {
    key: "florals",
    labelEn: "Florals & Design",
    labelEs: "Florales y diseño",
    subTypes: ["Florist", "Event designer / stylist", "Balloon artist"],
  },
  {
    key: "audio",
    labelEn: "Audio & Music",
    labelEs: "Audio y música",
    subTypes: [
      "DJ",
      "Live band",
      "Ceremony musicians",
      "Specialty performers",
      "MC / host",
    ],
  },
  {
    key: "visual",
    labelEn: "Visual Production & Lighting",
    labelEs: "Producción visual e iluminación",
    subTypes: ["AV / production company", "Lighting designer", "Stage / set builder"],
  },
  {
    key: "rentals",
    labelEn: "Rentals",
    labelEs: "Alquileres",
    subTypes: ["Décor rental company", "Dance floor / flooring", "Tenting company"],
  },
  // 'dessert' removed 2026-05-23 (Lock 14 amendment) — food & alcohol
  // categories live in the Catr portal where compliance is hard-gated.
  {
    key: "beauty",
    labelEn: "Personal & Beauty",
    labelEs: "Personal y belleza",
    subTypes: ["Hair stylist", "Makeup artist", "Wardrobe stylist / tailor"],
  },
  {
    key: "entertain",
    labelEn: "Interactive Entertainment",
    labelEs: "Entretenimiento interactivo",
    subTypes: ["Photo booth", "Casino tables", "Lawn games", "Activations"],
  },
  {
    key: "transport",
    labelEn: "Transportation & Logistics",
    labelEs: "Transporte y logística",
    subTypes: ["Guest transportation", "Luxury car service", "Valet company"],
  },
] as const;

export type VndrCategoryKey = (typeof VNDR_CATEGORIES)[number]["key"];

export const VNDR_CATEGORY_KEYS: readonly VndrCategoryKey[] = VNDR_CATEGORIES.map(
  (c) => c.key,
);

export function isVndrCategoryKey(value: unknown): value is VndrCategoryKey {
  return typeof value === "string" && VNDR_CATEGORY_KEYS.includes(value as VndrCategoryKey);
}
