import type { SuggestedUpload } from "../types";

/**
 * Wedding · Suggested upload slots — per-event-type semantic labels for the
 * "Bring it in" drawer section per B-4. Clicking a slot opens the file
 * picker with the slot tag preset; the resulting pin carries the label in
 * `mood_board_pins.tags` (existing TEXT[] column from migration 005).
 *
 * Chunk D's Flux prompt assembler reads slot tags to make slot-aware
 * prompts. Generic ("upload a photo") becomes specific ("editorial photo
 * of a wedding entry in the style of these references").
 */
export const weddingSuggestedUploads: SuggestedUpload[] = [
  { key: "entry", labelEn: "Entry", labelEs: "Entry" },
  { key: "ceremony-backdrop", labelEn: "Ceremony backdrop", labelEs: "Ceremony backdrop" },
  { key: "aisle", labelEn: "Aisle", labelEs: "Aisle" },
  { key: "altar", labelEn: "Altar", labelEs: "Altar" },
  { key: "centerpiece", labelEn: "Centerpiece", labelEs: "Centerpiece" },
  { key: "tableset", labelEn: "Tableset", labelEs: "Tableset" },
  { key: "place-setting", labelEn: "Place setting", labelEs: "Place setting" },
  { key: "cake-table", labelEn: "Cake table", labelEs: "Cake table" },
  { key: "lounge", labelEn: "Lounge", labelEs: "Lounge" },
  { key: "bar", labelEn: "Bar", labelEs: "Bar" },
  { key: "photo-wall", labelEn: "Photo wall", labelEs: "Photo wall" },
  { key: "exit", labelEn: "Exit", labelEs: "Exit" },
];
