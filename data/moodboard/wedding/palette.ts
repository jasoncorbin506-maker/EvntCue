import type { PaletteChip } from "../types";

/**
 * Wedding · Palette group — paint mode. 8 starter chips per the Chunk B
 * defaults table. Sourced from vocabulary research §2.3 (palette families)
 * × §2.4 (fabric types) — the eight here are the highest-frequency
 * combinations for the wedding category.
 *
 * Jason should eyeball this group + the Mood group before B-1 closes —
 * they're the most user-facing chips in the chunk.
 */
export const weddingPalette: PaletteChip[] = [
  {
    key: "blush-and-ivory",
    labelEn: "Blush & Ivory",
    labelEs: "Blush & Ivory",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#EAD7CE",
    fabricType: "linen",
    accentPalette: ["#F4ECE3", "#C99A8C", "#8B6F62"],
    defaultFor: ["wedding"],
  },
  {
    key: "sage-and-cream",
    labelEn: "Sage & Cream",
    labelEs: "Sage & Cream",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#B7C2A8",
    fabricType: "linen",
    accentPalette: ["#F5EFE3", "#7E8C6D", "#3B4A38"],
    defaultFor: ["wedding"],
  },
  {
    key: "terracotta",
    labelEn: "Terracotta",
    labelEs: "Terracotta",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#C06A47",
    fabricType: "cotton",
    accentPalette: ["#E5C3A4", "#7A3A22", "#2E1B12"],
    defaultFor: ["wedding"],
  },
  {
    key: "midnight-and-gold",
    labelEn: "Midnight & Gold",
    labelEs: "Midnight & Gold",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#1E2A44",
    fabricType: "velvet",
    accentPalette: ["#B6924A", "#0B1220", "#E8D9A8"],
    defaultFor: ["wedding"],
  },
  {
    key: "dusty-blue",
    labelEn: "Dusty Blue",
    labelEs: "Dusty Blue",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#8FA3B8",
    fabricType: "silk",
    accentPalette: ["#D9E1E8", "#3F5266", "#F1E9DC"],
    defaultFor: ["wedding"],
  },
  {
    key: "burgundy-and-champagne",
    labelEn: "Burgundy & Champagne",
    labelEs: "Burgundy & Champagne",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#732232",
    fabricType: "velvet",
    accentPalette: ["#E8D5A8", "#3A101A", "#F2E7D1"],
    defaultFor: ["wedding"],
  },
  {
    key: "forest-and-cream",
    labelEn: "Forest & Cream",
    labelEs: "Forest & Cream",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#2D4A33",
    fabricType: "linen",
    accentPalette: ["#F2EBD9", "#7A8C6D", "#1A2C1E"],
    defaultFor: ["wedding"],
  },
  {
    key: "black-and-white",
    labelEn: "Black & White",
    labelEs: "Black & White",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#0A0A0A",
    fabricType: "satin",
    accentPalette: ["#FFFFFF", "#1A1A1A", "#E8E8E8"],
    defaultFor: ["wedding"],
  },
];
