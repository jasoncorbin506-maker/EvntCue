import type { MoodChip } from "../types";

/**
 * Wedding · Mood group — pin mode. 8 starter chips per the Chunk B
 * defaults table. Sourced from vocabulary research §2.2 (mood / atmosphere
 * words). The swatch color for each is chosen to evoke the mood without
 * locking the user into a specific palette — moods are tonal cues, not
 * color picks.
 *
 * Jason should eyeball this group + Palette before B-1 closes.
 */
export const weddingMood: MoodChip[] = [
  {
    key: "romantic",
    labelEn: "Romantic",
    labelEs: "Romantic",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#D98A9A",
    promptSnippet: "romantic, soft, candlelit, intimate framing",
    defaultFor: ["wedding"],
  },
  {
    key: "intimate",
    labelEn: "Intimate",
    labelEs: "Intimate",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#B5707A",
    promptSnippet: "intimate, close framing, warm low-light, quiet",
    defaultFor: ["wedding"],
  },
  {
    key: "airy",
    labelEn: "Airy",
    labelEs: "Airy",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#D9D2C4",
    promptSnippet: "airy, light-filled, soft natural light, breezy",
    defaultFor: ["wedding"],
  },
  {
    key: "moody",
    labelEn: "Moody",
    labelEs: "Moody",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#3B3B4A",
    promptSnippet: "moody, deep shadows, dramatic, low key",
    defaultFor: ["wedding"],
  },
  {
    key: "grand",
    labelEn: "Grand",
    labelEs: "Grand",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#7A6A4A",
    promptSnippet: "grand, opulent, wide framing, ballroom-scale",
    defaultFor: ["wedding"],
  },
  {
    key: "joyful",
    labelEn: "Joyful",
    labelEs: "Joyful",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#E0A24E",
    promptSnippet: "joyful, vibrant, candid moments, celebratory",
    defaultFor: ["wedding"],
  },
  {
    key: "ethereal",
    labelEn: "Ethereal",
    labelEs: "Ethereal",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#E8D8E4",
    promptSnippet: "ethereal, dreamlike, soft focus, otherworldly",
    defaultFor: ["wedding"],
  },
  {
    key: "refined",
    labelEn: "Refined",
    labelEs: "Refined",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#7C7468",
    promptSnippet: "refined, restrained, considered, editorial",
    defaultFor: ["wedding"],
  },
];
