import type { TypographyChip } from "../types";

/**
 * Non-Profit · Typography group — 4 starter pairings. Mix of editorial
 * serif (annual-report register) + brand-display + classical-serif options.
 */
export const nonprofitTypography: TypographyChip[] = [
  {
    key: "cormorant-inter-np",
    labelEn: "Cormorant + Inter",
    labelEs: "Cormorant + Inter",
    group: "typography",
    renderAs: "pin",
    displayFont: "'Cormorant Garamond', serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400;0,500&display=swap",
    bodyFont: "'Inter', sans-serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap",
    defaultFor: ["nonprofit"],
  },
  {
    key: "playfair-lato-np",
    labelEn: "Playfair + Lato",
    labelEs: "Playfair + Lato",
    group: "typography",
    renderAs: "pin",
    displayFont: "'Playfair Display', serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&display=swap",
    bodyFont: "'Lato', sans-serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=Lato:wght@300;400&display=swap",
    defaultFor: ["nonprofit"],
  },
  {
    key: "archivo-inter-np",
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
    defaultFor: ["nonprofit"],
    substitutesFor: "Brand-display + Inter",
  },
  {
    key: "cinzel-garamond",
    labelEn: "Cinzel + EB Garamond",
    labelEs: "Cinzel + EB Garamond",
    group: "typography",
    renderAs: "pin",
    displayFont: "'Cinzel', serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap",
    bodyFont: "'EB Garamond', serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;1,400&display=swap",
    defaultFor: ["nonprofit"],
    substitutesFor: "Trajan (foundry-licensed) + EB Garamond",
  },
];
