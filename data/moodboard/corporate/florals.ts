import type { FloralsChip } from "../types";

/**
 * Corporate · Florals group — 4 starter chips per Chunk B defaults.
 * Corporate florals are tighter, branded, and shorter than wedding
 * florals — they exist to soften without competing with stage/branding.
 */
export const corporateFlorals: FloralsChip[] = [
  {
    key: "low-profile-arrangement",
    labelEn: "Low-profile arrangement",
    labelEs: "Low-profile arrangement",
    group: "florals",
    renderAs: "pin",
    swatchHex: "#B7C2A8",
    promptSnippet: "low-profile floral arrangement, doesn't block sight lines",
    defaultFor: ["corporate"],
  },
  {
    key: "brand-color-anchored",
    labelEn: "Brand-color anchored",
    labelEs: "Brand-color anchored",
    group: "florals",
    renderAs: "pin",
    swatchHex: "#D98A6A",
    promptSnippet: "florals chosen to echo the brand's primary color palette",
    defaultFor: ["corporate"],
  },
  {
    key: "greenery-garland-corp",
    labelEn: "Greenery garland",
    labelEs: "Greenery garland",
    group: "florals",
    renderAs: "pin",
    swatchHex: "#5E7A4F",
    promptSnippet: "modest greenery garland along stage edges or registration",
    defaultFor: ["corporate"],
  },
  {
    key: "single-stem-corp",
    labelEn: "Single stem",
    labelEs: "Single stem",
    group: "florals",
    renderAs: "pin",
    swatchHex: "#D4C9B3",
    promptSnippet: "single-stem bud vases at cocktail tables",
    defaultFor: ["corporate"],
  },
];
