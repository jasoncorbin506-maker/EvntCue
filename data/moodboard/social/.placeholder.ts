/**
 * Social category — vocabulary research Part 8 not yet written.
 *
 * Per the Chunk B brief "Out of scope" list: this category ships as a stub.
 * The byCategory("social") lookup falls back to the generic palette
 * (currently the wedding palette) until vocab research Part 8 lands and
 * Cowork files an updated handoff.
 *
 * Note: Lock 13's `family_milestone` boolean handles longer-lead social
 * events (Quinceañeras, bar/bat mitzvahs, milestone birthdays, sweet
 * sixteens, anniversary parties, vow renewals). These will likely use the
 * cultural-traditions picker (migration 024) as the augmentation seam,
 * similar to wedding/cultural/.
 *
 * TODO: vocab research Part 8 (Social) and structured chip arrays.
 */

import type { ChipPalette } from "../types";

export const socialPlaceholder: Partial<ChipPalette> = {
  category: "social",
  palette: [],
  material: [],
  mood: [],
  florals: [],
  typography: [],
  suggestedUploads: [],
};
