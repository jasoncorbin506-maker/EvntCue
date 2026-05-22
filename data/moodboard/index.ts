/**
 * Mood Board chip taxonomy — entry point.
 *
 * Exports `byCategory(eventCategory)` returning a ChipPalette per the
 * Chunk B brief. Wedding fully populated, Corporate + Non-Profit
 * substantially populated, Public/Cultural + Social stubbed.
 *
 * Generic fallback (`genericFallback`) is used when:
 *   - `events.event_subtype` is NULL (per B-4 brief)
 *   - The event category is one of the stubbed categories (public, social)
 *
 * The generic fallback is a curated subset of the wedding palette + 5
 * universal suggested-upload slots (Centerpiece / Tableset / Lighting /
 * Bar / Entry per the brief).
 */

import type { ChipPalette, EventCategory, SuggestedUpload } from "./types";

// Wedding
import { weddingPalette } from "./wedding/palette";
import { weddingMaterial } from "./wedding/material";
import { weddingMood } from "./wedding/mood";
import { weddingFlorals } from "./wedding/florals";
import { weddingTypography } from "./wedding/typography";
import { weddingSuggestedUploads } from "./wedding/suggested-uploads";

// Corporate
import { corporatePalette } from "./corporate/palette";
import { corporateMaterial } from "./corporate/material";
import { corporateMood } from "./corporate/mood";
import { corporateFlorals } from "./corporate/florals";
import { corporateTypography } from "./corporate/typography";
import { corporateSuggestedUploads } from "./corporate/suggested-uploads";

// Non-Profit
import { nonprofitPalette } from "./nonprofit/palette";
import { nonprofitMaterial } from "./nonprofit/material";
import { nonprofitMood } from "./nonprofit/mood";
import { nonprofitFlorals } from "./nonprofit/florals";
import { nonprofitTypography } from "./nonprofit/typography";
import { nonprofitSuggestedUploads } from "./nonprofit/suggested-uploads";

export const weddingPalette_full: ChipPalette = {
  category: "wedding",
  palette: weddingPalette,
  material: weddingMaterial,
  mood: weddingMood,
  florals: weddingFlorals,
  typography: weddingTypography,
  suggestedUploads: weddingSuggestedUploads,
};

export const corporatePalette_full: ChipPalette = {
  category: "corporate",
  palette: corporatePalette,
  material: corporateMaterial,
  mood: corporateMood,
  florals: corporateFlorals,
  typography: corporateTypography,
  suggestedUploads: corporateSuggestedUploads,
};

export const nonprofitPalette_full: ChipPalette = {
  category: "nonprofit",
  palette: nonprofitPalette,
  material: nonprofitMaterial,
  mood: nonprofitMood,
  florals: nonprofitFlorals,
  typography: nonprofitTypography,
  suggestedUploads: nonprofitSuggestedUploads,
};

/**
 * Generic fallback per B-4 — 5 universal slot labels.
 */
const genericSuggestedUploads: SuggestedUpload[] = [
  { key: "centerpiece", labelEn: "Centerpiece", labelEs: "Centerpiece" },
  { key: "tableset", labelEn: "Tableset", labelEs: "Tableset" },
  { key: "lighting", labelEn: "Lighting", labelEs: "Lighting" },
  { key: "bar", labelEn: "Bar", labelEs: "Bar" },
  { key: "entry", labelEn: "Entry", labelEs: "Entry" },
];

const genericFallback: ChipPalette = {
  category: "wedding",
  palette: weddingPalette,
  material: weddingMaterial,
  mood: weddingMood,
  florals: weddingFlorals,
  typography: weddingTypography,
  suggestedUploads: genericSuggestedUploads,
};

/**
 * Per-category palette lookup. Returns the appropriate ChipPalette or the
 * generic fallback for stubbed/unknown categories.
 *
 * @param category - The event category, or null/undefined to get the
 *                   generic fallback.
 */
export function byCategory(
  category: EventCategory | null | undefined,
): ChipPalette {
  switch (category) {
    case "wedding":
      return weddingPalette_full;
    case "corporate":
      return corporatePalette_full;
    case "nonprofit":
      return nonprofitPalette_full;
    case "public":
    case "social":
      // Stubbed categories — fall back to generic.
      return genericFallback;
    default:
      return genericFallback;
  }
}

export { genericFallback };
export type { ChipPalette, EventCategory, AnyChip, PaletteChip, MaterialChip, MoodChip, FloralsChip, TypographyChip, SuggestedUpload, ChipGroup, ChipRenderMode, FabricType } from "./types";
