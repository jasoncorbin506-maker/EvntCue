import type { MaterialChip } from "../types";

/**
 * Corporate · Material group — pin mode. 6 starter chips. Production
 * surfaces (hardwall, pipe & drape, LED tile, scenic foam) sit in this
 * group alongside the more conventional metal/concrete finishes.
 */
export const corporateMaterial: MaterialChip[] = [
  {
    key: "hardwall",
    labelEn: "Hardwall",
    labelEs: "Hardwall",
    group: "material",
    renderAs: "pin",
    swatchHex: "#D8D8D8",
    promptSnippet: "smooth painted hardwall booth with sharp edges",
    defaultFor: ["corporate"],
  },
  {
    key: "pipe-and-drape",
    labelEn: "Pipe & drape",
    labelEs: "Pipe & drape",
    group: "material",
    renderAs: "pin",
    swatchHex: "#3A3A3A",
    promptSnippet: "black pipe and drape backdrop",
    defaultFor: ["corporate"],
  },
  {
    key: "led-tile",
    labelEn: "LED tile",
    labelEs: "LED tile",
    group: "material",
    renderAs: "pin",
    swatchHex: "#1A1A1A",
    promptSnippet: "LED video wall tiles, dynamic content",
    defaultFor: ["corporate"],
  },
  {
    key: "scenic-foam",
    labelEn: "Scenic foam",
    labelEs: "Scenic foam",
    group: "material",
    renderAs: "pin",
    swatchHex: "#C9BFAA",
    promptSnippet: "CNC-cut scenic foam dimensional letters or shapes",
    defaultFor: ["corporate"],
  },
  {
    key: "brushed-metal",
    labelEn: "Brushed metal",
    labelEs: "Brushed metal",
    group: "material",
    renderAs: "pin",
    swatchHex: "#8C8C8C",
    promptSnippet: "brushed aluminum or stainless steel accents",
    defaultFor: ["corporate"],
  },
  {
    key: "concrete",
    labelEn: "Concrete",
    labelEs: "Concrete",
    group: "material",
    renderAs: "pin",
    swatchHex: "#6E6E6E",
    promptSnippet: "polished concrete floor and architectural surfaces",
    defaultFor: ["corporate"],
  },
];
