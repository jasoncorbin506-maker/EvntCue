import type { TypographyChip } from "../types";

/**
 * Corporate · Typography group — 4 starter pairings. Heavier on geometric
 * sans than wedding's editorial serifs; brand-display pairings are common.
 */
export const corporateTypography: TypographyChip[] = [
  {
    key: "ibm-plex-inter",
    labelEn: "IBM Plex + Inter",
    labelEs: "IBM Plex + Inter",
    group: "typography",
    renderAs: "pin",
    displayFont: "'IBM Plex Sans', sans-serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@500;600&display=swap",
    bodyFont: "'Inter', sans-serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap",
    defaultFor: ["corporate"],
    substitutesFor: "GT America + GT America",
  },
  {
    key: "manrope-inter",
    labelEn: "Manrope + Inter",
    labelEs: "Manrope + Inter",
    group: "typography",
    renderAs: "pin",
    displayFont: "'Manrope', sans-serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=Manrope:wght@600;700&display=swap",
    bodyFont: "'Inter', sans-serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap",
    defaultFor: ["corporate"],
    substitutesFor: "Söhne (display) + Söhne (body)",
  },
  {
    key: "space-grotesk-inter",
    labelEn: "Space Grotesk + Inter",
    labelEs: "Space Grotesk + Inter",
    group: "typography",
    renderAs: "pin",
    displayFont: "'Space Grotesk', sans-serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap",
    bodyFont: "'Inter', sans-serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap",
    defaultFor: ["corporate"],
  },
  {
    key: "archivo-inter",
    labelEn: "Archivo + Inter",
    labelEs: "Archivo + Inter",
    group: "typography",
    renderAs: "pin",
    displayFont: "'Archivo', sans-serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&display=swap",
    bodyFont: "'Inter', sans-serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap",
    defaultFor: ["corporate"],
    substitutesFor: "Brand-display + Inter (when brand has no licensed display face)",
  },
];
