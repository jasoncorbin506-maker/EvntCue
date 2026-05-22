import type { PaletteChip } from "../types";

/**
 * Corporate · Palette group — paint mode. 6 starter chips per Chunk B
 * defaults. Corporate palettes tend toward brand-color anchoring + modern
 * monochrome registers rather than wedding's romantic earth tones.
 */
export const corporatePalette: PaletteChip[] = [
  {
    key: "brand-neutral",
    labelEn: "Brand-Neutral",
    labelEs: "Brand-Neutral",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#1B1F23",
    fabricType: "satin",
    accentPalette: ["#FFFFFF", "#9CA3AF", "#E5E7EB"],
    defaultFor: ["corporate"],
  },
  {
    key: "modern-monochrome",
    labelEn: "Modern Monochrome",
    labelEs: "Modern Monochrome",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#2A2A2A",
    fabricType: "satin",
    accentPalette: ["#4A4A4A", "#737373", "#A8A8A8"],
    defaultFor: ["corporate"],
  },
  {
    key: "black-and-gold",
    labelEn: "Black + Gold",
    labelEs: "Black + Gold",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#0A0A0A",
    fabricType: "velvet",
    accentPalette: ["#C9A84A", "#FFFFFF", "#1F1F1F"],
    defaultFor: ["corporate"],
  },
  {
    key: "luxe-jewel",
    labelEn: "Luxe Jewel",
    labelEs: "Luxe Jewel",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#1E3A5F",
    fabricType: "velvet",
    accentPalette: ["#7A2E2E", "#3D5A45", "#C9A84A"],
    defaultFor: ["corporate"],
  },
  {
    key: "future-gradient",
    labelEn: "Future Gradient",
    labelEs: "Future Gradient",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#4A3A8C",
    fabricType: "satin",
    accentPalette: ["#7A5AC9", "#1E3A8A", "#E0C5FF"],
    defaultFor: ["corporate"],
  },
  {
    key: "sustainability-earth",
    labelEn: "Sustainability Earth",
    labelEs: "Sustainability Earth",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#6B5638",
    fabricType: "linen",
    accentPalette: ["#A89072", "#3D4A2D", "#E8DCC3"],
    defaultFor: ["corporate"],
  },
];
