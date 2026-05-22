import type { MaterialChip } from "../types";

/**
 * Wedding · Material group — pin mode. 8 starter chips per the Chunk B
 * defaults table. Drops a swatch pin (color + name) when clicked.
 *
 * Per the brief: Material chips DO NOT paint the canvas (that's Palette's
 * job). A user can have an Ivory linen *fabric* (Palette) and a Raw silk
 * *swatch pin* (Material) on the board simultaneously — the fabric is the
 * room's primary surface, the swatch is a sample being considered for
 * accent treatments (drapery, runners, napkins).
 *
 * Co-occurrence weights drive the smart-suggestion engine (full re-sort
 * logic is a polish-pass). Picking "boho" + "fall" should preload
 * macramé / cheesecloth / terracotta / dried botanicals into default-visible.
 */
export const weddingMaterial: MaterialChip[] = [
  {
    key: "ivory-linen",
    labelEn: "Ivory linen",
    labelEs: "Ivory linen",
    group: "material",
    renderAs: "pin",
    swatchHex: "#E8E1D2",
    promptSnippet: "ivory linen with visible weave texture",
    defaultFor: ["wedding"],
    coOccurrence: { airy: 2, romantic: 1, "blush-and-ivory": 2 },
  },
  {
    key: "raw-silk",
    labelEn: "Raw silk",
    labelEs: "Raw silk",
    group: "material",
    renderAs: "pin",
    swatchHex: "#D8C9B0",
    promptSnippet: "raw silk with subtle sheen and slight slub",
    defaultFor: ["wedding"],
    coOccurrence: { refined: 2, grand: 1 },
  },
  {
    key: "walnut",
    labelEn: "Walnut",
    labelEs: "Walnut",
    group: "material",
    renderAs: "pin",
    swatchHex: "#5C4632",
    promptSnippet: "warm walnut wood, satin finish",
    defaultFor: ["wedding"],
    coOccurrence: { moody: 1, intimate: 2 },
  },
  {
    key: "beeswax",
    labelEn: "Beeswax candle",
    labelEs: "Beeswax candle",
    group: "material",
    renderAs: "pin",
    swatchHex: "#E6B25C",
    promptSnippet: "natural beeswax taper candles, golden warm light",
    defaultFor: ["wedding"],
    coOccurrence: { intimate: 2, romantic: 2, moody: 2 },
  },
  {
    key: "marble",
    labelEn: "Marble",
    labelEs: "Marble",
    group: "material",
    renderAs: "pin",
    swatchHex: "#E4E6E8",
    promptSnippet: "white marble with soft grey veining",
    defaultFor: ["wedding"],
    coOccurrence: { refined: 2, grand: 1, "black-and-white": 2 },
  },
  {
    key: "brass",
    labelEn: "Brass",
    labelEs: "Brass",
    group: "material",
    renderAs: "pin",
    swatchHex: "#B6924A",
    promptSnippet: "brushed brass accents, warm metallic",
    defaultFor: ["wedding"],
    coOccurrence: { "midnight-and-gold": 2, refined: 1, grand: 1 },
  },
  {
    key: "dried-botanicals",
    labelEn: "Dried botanicals",
    labelEs: "Dried botanicals",
    group: "material",
    renderAs: "pin",
    swatchHex: "#A89072",
    promptSnippet: "dried wheat, pampas grass, preserved florals",
    defaultFor: ["wedding"],
    coOccurrence: { terracotta: 2, "forest-and-cream": 1, airy: 1 },
  },
  {
    key: "velvet-runner",
    labelEn: "Velvet runner",
    labelEs: "Velvet runner",
    group: "material",
    renderAs: "pin",
    swatchHex: "#5A2A36",
    promptSnippet: "deep velvet table runner with dimensional pile",
    defaultFor: ["wedding"],
    coOccurrence: { "burgundy-and-champagne": 2, moody: 2, grand: 1 },
  },
];
