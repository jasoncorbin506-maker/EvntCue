import type { FloralsChip } from "../types";

/**
 * Non-Profit · Florals group — 4 starter chips per Chunk B defaults.
 */
export const nonprofitFlorals: FloralsChip[] = [
  {
    key: "low-profile-arrangement-np",
    labelEn: "Low-profile arrangement",
    labelEs: "Low-profile arrangement",
    group: "florals",
    renderAs: "pin",
    swatchHex: "#B7C2A8",
    promptSnippet: "low-profile arrangement that doesn't block table conversation",
    defaultFor: ["nonprofit"],
  },
  {
    key: "candelabra-with-florals",
    labelEn: "Candelabra with florals",
    labelEs: "Candelabra with florals",
    group: "florals",
    renderAs: "pin",
    swatchHex: "#C9A84A",
    promptSnippet: "tall candelabra with cascading florals at top",
    defaultFor: ["nonprofit"],
  },
  {
    key: "greenery-np",
    labelEn: "Greenery",
    labelEs: "Greenery",
    group: "florals",
    renderAs: "pin",
    swatchHex: "#5E7A4F",
    promptSnippet: "soft greenery accents on tables and registration",
    defaultFor: ["nonprofit"],
  },
  {
    key: "honoree-spray",
    labelEn: "Honoree spray",
    labelEs: "Honoree spray",
    group: "florals",
    renderAs: "pin",
    swatchHex: "#E2A0A8",
    promptSnippet: "spray of florals for the honoree's recognition table",
    defaultFor: ["nonprofit"],
  },
];
