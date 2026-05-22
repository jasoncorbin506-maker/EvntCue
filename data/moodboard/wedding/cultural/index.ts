/**
 * Wedding cultural descriptor pools — Lock 14 compliant placeholder.
 *
 * Per the Chunk B brief's "Out of scope" list: cultural sub-vocab files
 * exist as stubs in this directory. The runtime augmentation logic
 * (generic chips PLUS cultural chips when a tradition is opted into via
 * migration 024) lands as Chunk B+ or a polish pass.
 *
 * Per-tradition exports (stubbed for Chunk B):
 *   catholic · hindu · jewish · korean · mexican · nigerian · persian
 *
 * See README.md in this directory for the architectural plan.
 */

import type {
  MaterialChip,
  MoodChip,
  FloralsChip,
  SuggestedUpload,
} from "../../types";

export interface CulturalAugmentation {
  material: MaterialChip[];
  mood: MoodChip[];
  florals: FloralsChip[];
  suggestedUploads: SuggestedUpload[];
}

const empty: CulturalAugmentation = {
  material: [],
  mood: [],
  florals: [],
  suggestedUploads: [],
};

// Stubs — Chunk B+ populates these from vocab research §2.10.
export const catholic = empty;
export const hindu = empty;
export const jewish = empty;
export const korean = empty;
export const mexican = empty;
export const nigerian = empty;
export const persian = empty;

/**
 * Stub augmentation lookup. Returns an empty pool for any tradition until
 * Chunk B+ wires the real per-tradition chip arrays.
 */
export function culturalAugmentationFor(
  _traditionKey: string | null,
): CulturalAugmentation {
  return empty;
}
