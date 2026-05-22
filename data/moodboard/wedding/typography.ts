import type { TypographyChip } from "../types";

/**
 * Wedding · Typography group — 6 font pairings per the Chunk B defaults.
 * Each pairing is display + body, rendered together on a Polaroid frame
 * with personalized specimen text (events.name + events.start_date when
 * available; "Maya & Liam" / "April 17, 2027 · Stonewall Estate" fallback).
 *
 * Foundry-licensed fonts in the brief (Tan Pearl, Sangbleu Empire, Söhne,
 * GT America) are substituted with Google Fonts equivalents documented in
 * `substitutesFor`. Future paid-foundry swap is a one-line change per chip.
 */
export const weddingTypography: TypographyChip[] = [
  {
    key: "cormorant-inter",
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
    defaultFor: ["wedding"],
  },
  {
    key: "playfair-lato",
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
    defaultFor: ["wedding"],
  },
  {
    key: "italiana-karla",
    labelEn: "Italiana + Karla",
    labelEs: "Italiana + Karla",
    group: "typography",
    renderAs: "pin",
    displayFont: "'Italiana', serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=Italiana&display=swap",
    bodyFont: "'Karla', sans-serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=Karla:wght@300;400&display=swap",
    defaultFor: ["wedding"],
  },
  {
    key: "cormorant-sc-outfit",
    labelEn: "Cormorant SC + Outfit",
    labelEs: "Cormorant SC + Outfit",
    group: "typography",
    renderAs: "pin",
    displayFont: "'Cormorant SC', serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=Cormorant+SC:wght@400;500&display=swap",
    bodyFont: "'Outfit', sans-serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400&display=swap",
    defaultFor: ["wedding"],
    substitutesFor: "Tan Pearl + Outfit",
  },
  {
    key: "bodoni-moda-avenir-fallback",
    labelEn: "Bodoni Moda + Mulish",
    labelEs: "Bodoni Moda + Mulish",
    group: "typography",
    renderAs: "pin",
    displayFont: "'Bodoni Moda', serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;1,400&display=swap",
    bodyFont: "'Mulish', sans-serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=Mulish:wght@300;400&display=swap",
    defaultFor: ["wedding"],
    substitutesFor: "Bodoni + Avenir (Avenir is foundry-licensed)",
  },
  {
    key: "dm-serif-display-inter",
    labelEn: "DM Serif Display + Inter",
    labelEs: "DM Serif Display + Inter",
    group: "typography",
    renderAs: "pin",
    displayFont: "'DM Serif Display', serif",
    displayFontHref:
      "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap",
    bodyFont: "'Inter', sans-serif",
    bodyFontHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap",
    defaultFor: ["wedding"],
    substitutesFor: "Sangbleu Empire + Söhne",
  },
];
