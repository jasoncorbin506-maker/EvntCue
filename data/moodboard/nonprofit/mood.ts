import type { MoodChip } from "../types";

/**
 * Non-Profit · Mood group — 6 starter chips per Chunk B defaults.
 * Non-profit moods skew toward reverence + gratitude + aspiration; less
 * romance, less sales-energy.
 */
export const nonprofitMood: MoodChip[] = [
  {
    key: "reverent",
    labelEn: "Reverent",
    labelEs: "Reverent",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#3B3B4A",
    promptSnippet: "reverent, hushed, quiet ceremony, candlelit",
    defaultFor: ["nonprofit"],
  },
  {
    key: "celebratory-np",
    labelEn: "Celebratory",
    labelEs: "Celebratory",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#E0A24E",
    promptSnippet: "celebratory, warm, milestone-marking",
    defaultFor: ["nonprofit"],
  },
  {
    key: "hopeful",
    labelEn: "Hopeful",
    labelEs: "Hopeful",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#F2EBD9",
    promptSnippet: "hopeful, bright, forward-looking",
    defaultFor: ["nonprofit"],
  },
  {
    key: "dignified",
    labelEn: "Dignified",
    labelEs: "Dignified",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#2D5A87",
    promptSnippet: "dignified, considered, formal-but-warm",
    defaultFor: ["nonprofit"],
  },
  {
    key: "grateful",
    labelEn: "Grateful",
    labelEs: "Grateful",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#C9A84A",
    promptSnippet: "grateful, recognition-centered, honoree-focused",
    defaultFor: ["nonprofit"],
  },
  {
    key: "aspirational",
    labelEn: "Aspirational",
    labelEs: "Aspirational",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#3D5A45",
    promptSnippet: "aspirational, mission-forward, visionary",
    defaultFor: ["nonprofit"],
  },
];
