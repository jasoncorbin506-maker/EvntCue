import type { MoodChip } from "../types";

/**
 * Corporate · Mood group — 6 starter chips per Chunk B defaults.
 * (The brief proposed a separate `themes.ts` for corporate "Theme
 * archetypes," but the 5-group taxonomy maps cleaner if theme archetypes
 * live in this Mood file. Cowork to confirm at next handoff; reversion is
 * a rename + import update.)
 */
export const corporateMood: MoodChip[] = [
  {
    key: "bold",
    labelEn: "Bold",
    labelEs: "Bold",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#C2362F",
    promptSnippet: "bold, high-contrast, statement-scale",
    defaultFor: ["corporate"],
  },
  {
    key: "future-forward",
    labelEn: "Future-forward",
    labelEs: "Future-forward",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#4A3A8C",
    promptSnippet: "future-forward, tech-aesthetic, LED-rich, gradient",
    defaultFor: ["corporate"],
  },
  {
    key: "refined-corp",
    labelEn: "Refined",
    labelEs: "Refined",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#5A5A5A",
    promptSnippet: "refined, restrained, editorial corporate",
    defaultFor: ["corporate"],
  },
  {
    key: "energetic",
    labelEn: "Energetic",
    labelEs: "Energetic",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#E68A2E",
    promptSnippet: "energetic, motion-rich, crowd-celebratory",
    defaultFor: ["corporate"],
  },
  {
    key: "sophisticated",
    labelEn: "Sophisticated",
    labelEs: "Sophisticated",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#1E2A44",
    promptSnippet: "sophisticated, polished, executive register",
    defaultFor: ["corporate"],
  },
  {
    key: "mission-driven",
    labelEn: "Mission-driven",
    labelEs: "Mission-driven",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#3D5A45",
    promptSnippet: "mission-driven, purpose-led, brand-narrative center",
    defaultFor: ["corporate"],
  },
];
