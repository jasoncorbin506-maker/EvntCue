/**
 * Lock 21 10-slot output scaffold for the AI render spread.
 *
 * This is the OUTPUT scaffold (where renders go), distinct from the
 * per-category `suggestedUploads` in this module (the INPUT taxonomy
 * for what users upload). Same vocabulary research, different surface.
 *
 * Per Lock 21 (CLOSED 2026-05-17): slot list is FIXED across all
 * categories. What rotates per category is what *kind* of imagery
 * fills each slot — captured here as `compositionByCategory` for
 * the prompt assembler.
 *
 * Per Lock 13 (multi-event-type): all five categories at equal weight.
 * Wedding / Corporate / Non-Profit have explicit composition recipes;
 * Public / Social fall back to wedding via `byCategorySlot()` until
 * their vocabulary research lands (Parts 7 + 8 of the research doc).
 *
 * Source: vocabulary research at
 * ~/Desktop/Backstage/product/moodboard/moodboard-vocabulary-research.md
 * and the refreshed wrapper at
 * ~/Desktop/Backstage/product/moodboard/cc-handoff-moodboard-wrapper.md §5.3.
 */

import type { EventCategory } from "./types";

/** The 10 fixed Lock 21 output slots, in editorial-spread order. */
export type SlotKey =
  | "hero"
  | "tablescape"
  | "floral"
  | "lighting"
  | "palette-swatch"
  | "texture"
  | "color-moment"
  | "food-plating"
  | "ambient"
  | "attire";

/** Stable in-order list — server action iterates this for the 10 parallel calls. */
export const SLOT_ORDER: readonly SlotKey[] = [
  "hero",
  "tablescape",
  "floral",
  "lighting",
  "palette-swatch",
  "texture",
  "color-moment",
  "food-plating",
  "ambient",
  "attire",
] as const;

/** Slot metadata — label + the aspect ratio of the rendered image. */
export interface SlotDef {
  key: SlotKey;
  labelEn: string;
  labelEs: string;
  /** Aspect ratio passed to RenderService. Hero is widescreen; others square
   *  for the 2-up + 1-up rhythm of the editorial spread. */
  aspectRatio: "1:1" | "16:9" | "4:3" | "3:4";
}

export const SLOTS: Record<SlotKey, SlotDef> = {
  hero: { key: "hero", labelEn: "Hero", labelEs: "Hero", aspectRatio: "16:9" },
  tablescape: { key: "tablescape", labelEn: "Tablescape", labelEs: "Tablescape", aspectRatio: "1:1" },
  floral: { key: "floral", labelEn: "Floral", labelEs: "Floral", aspectRatio: "1:1" },
  lighting: { key: "lighting", labelEn: "Lighting", labelEs: "Iluminación", aspectRatio: "1:1" },
  "palette-swatch": { key: "palette-swatch", labelEn: "Palette swatch", labelEs: "Paleta", aspectRatio: "1:1" },
  texture: { key: "texture", labelEn: "Texture", labelEs: "Textura", aspectRatio: "1:1" },
  "color-moment": { key: "color-moment", labelEn: "Color moment", labelEs: "Color moment", aspectRatio: "1:1" },
  "food-plating": { key: "food-plating", labelEn: "Food", labelEs: "Comida", aspectRatio: "1:1" },
  ambient: { key: "ambient", labelEn: "Ambient", labelEs: "Ambiente", aspectRatio: "1:1" },
  attire: { key: "attire", labelEn: "Attire", labelEs: "Vestimenta", aspectRatio: "1:1" },
};

/**
 * Per-category photography modifier. Sets the genre register before any
 * chip-derived modifiers. Per refreshed wrapper §5.4.
 */
export const PHOTOGRAPHY_BY_CATEGORY: Record<EventCategory, string> = {
  wedding: "fine-art wedding photography, editorial wedding spread, shot on Kodak Portra 400",
  corporate: "corporate event photography, branded environment, documentary-style",
  nonprofit: "charity gala photography, candlelit dinner, black-tie celebration",
  public: "fine-art event photography, editorial spread",         // stub — falls back to wedding-leaning
  social: "fine-art event photography, editorial spread",         // stub — same
};

/**
 * Per-category-per-slot composition recipe. Tells the prompt what kind of
 * imagery the slot should hold. Per refreshed wrapper §5.3 fill table.
 *
 * Each value is a noun-phrase string the assembler drops into the prompt
 * immediately after the photography modifier.
 */
type CategoryCompositions = Record<SlotKey, string>;

const weddingComp: CategoryCompositions = {
  hero: "venue exterior at the chosen time of day, theme expressed in architecture and dressing",
  tablescape: "long table with linens, layered place setting, floral runner, candlelight",
  floral: "arrangement style and bloom family in focus, soft natural light",
  lighting: "candles, string lights, or chandelier — light source as composition",
  "palette-swatch": "fabric swatches and color cards arranged flat-lay, magazine style",
  texture: "fabric or surface detail in extreme close-up — silk, velvet, linen, lace",
  "color-moment": "florals or fabric detail with the palette popping, shallow depth of field",
  "food-plating": "menu style and cuisine, plated dish on a textured surface, top-down",
  ambient: "wide shot of venue character, scale and atmosphere",
  attire: "bridal or partner silhouette and fabric in editorial pose",
};

const corporateComp: CategoryCompositions = {
  hero: "stage with brand activation, theme in scenic and lighting design",
  tablescape: "branded place setting with sponsor signage, executive luncheon style",
  floral: "low-profile brand-color anchored centerpieces",
  lighting: "production lighting with wash and gobo, theatrical depth",
  "palette-swatch": "brand palette enforced — primary, secondary, accent in flat-lay",
  texture: "scenic surface texture, branded materials, polished finish",
  "color-moment": "brand activation detail moment with palette popping",
  "food-plating": "reception bites or branded F&B, modern plating",
  ambient: "branded environment with attendees in soft focus",
  attire: "business attire or black-tie depending on event tier",
};

const nonprofitComp: CategoryCompositions = {
  hero: "ballroom interior with candlelight, brand expressed in restrained way",
  tablescape: "head table with bidder paddles and program, gala styling",
  floral: "low-profile brand-anchored florals plus auction-item display option",
  lighting: "uplighting in brand color, pinspots on centerpieces",
  "palette-swatch": "brand palette enforced — restrained, donor-appropriate",
  texture: "linen and sponsor signage material, refined surfaces",
  "color-moment": "sponsor recognition wall or mission visual with palette emphasis",
  "food-plating": "gala plated dinner course, candlelit table",
  ambient: "ballroom ambient with attendees at tables, warm focus",
  attire: "black-tie or dressy-casual, mission-appropriate",
};

/** Wedding-leaning fallback for stubbed categories until research lands. */
const fallbackComp: CategoryCompositions = weddingComp;

const COMPOSITION_BY_CATEGORY: Record<EventCategory, CategoryCompositions> = {
  wedding: weddingComp,
  corporate: corporateComp,
  nonprofit: nonprofitComp,
  public: fallbackComp,
  social: fallbackComp,
};

/** Look up the composition recipe for a category × slot. */
export function compositionForSlot(
  category: EventCategory,
  slotKey: SlotKey,
): string {
  return COMPOSITION_BY_CATEGORY[category][slotKey];
}
