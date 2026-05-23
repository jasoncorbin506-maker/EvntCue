/**
 * Unit tests for assemblePrompt (Chunk D Step 3b).
 *
 * 7 fixtures covering: basic structure, chip modifier emission, fallback
 * behavior for unknown chip keys, and the structural guarantees that
 * Lock 21 requires (editorial lexicon prepend + banned-vocab negation
 * always present).
 *
 * Caller-provided photography + composition + catalog mean the tests
 * construct everything inline. Production lookups happen in the server
 * action (Chunk D Step 3c).
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { assemblePrompt } from "./prompt-assembler.ts";
import type { BoardSnapshot } from "../moodboard/board-snapshot.ts";
import type {
  ChipPalette,
  PaletteChip,
  MoodChip,
  MaterialChip,
  FloralsChip,
} from "../../data/moodboard/types.ts";

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

function snapshot(
  overrides: Partial<BoardSnapshot> = {},
): BoardSnapshot {
  return {
    boardId: "board-uuid",
    eventCategory: "wedding",
    eventSubtype: null,
    fabric: null,
    chipSelections: {
      mood: [],
      material: [],
      florals: [],
      typography: [],
    },
    pins: [],
    ...overrides,
  };
}

const palette: PaletteChip[] = [
  {
    key: "boho-pampas-cream",
    labelEn: "Boho Pampas Cream",
    labelEs: "Boho Pampas Cream",
    group: "palette",
    renderAs: "paint",
    primaryColor: "#f5ecd9",
    fabricType: "linen",
    accentPalette: ["#d9b384", "#8b6b3f"],
  },
];

const mood: MoodChip[] = [
  {
    key: "ethereal",
    labelEn: "Ethereal",
    labelEs: "Ethereal",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#f8e9d6",
    promptSnippet: "ethereal soft morning light",
  },
  {
    key: "moody",
    labelEn: "Moody",
    labelEs: "Moody",
    group: "mood",
    renderAs: "pin",
    swatchHex: "#2a1f1a",
    // No promptSnippet — falls back to labelEn lowercased.
  },
];

const material: MaterialChip[] = [
  {
    key: "raw-linen",
    labelEn: "Raw Linen",
    labelEs: "Raw Linen",
    group: "material",
    renderAs: "pin",
    swatchHex: "#e8dfc4",
    promptSnippet: "raw linen drape",
  },
];

const florals: FloralsChip[] = [
  {
    key: "pampas-grass",
    labelEn: "Pampas Grass",
    labelEs: "Pampas Grass",
    group: "florals",
    renderAs: "pin",
    swatchHex: "#d9c8a6",
    promptSnippet: "pampas grass plumes",
  },
];

const fixtureCatalog: ChipPalette = {
  category: "wedding",
  palette,
  material,
  mood,
  florals,
  typography: [],
  suggestedUploads: [],
};

const weddingPhotography =
  "fine-art wedding photography, editorial wedding spread, shot on Kodak Portra 400";
const corporatePhotography =
  "corporate event photography, branded environment, documentary-style";
const heroComposition =
  "venue exterior at the chosen time of day, theme expressed in architecture and dressing";
const stageComposition =
  "stage with brand activation, theme in scenic and lighting design";

// -------------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------------

describe("assemblePrompt", () => {
  test("structural guarantees — editorial lexicon prepend + banned-vocab negation always present", () => {
    const prompt = assemblePrompt({
      snapshot: snapshot(),
      photography: weddingPhotography,
      composition: heroComposition,
      catalog: fixtureCatalog,
    });

    assert.match(prompt, /^evocative, moody, soft focus/);
    assert.match(prompt, /not photoreal/);
    assert.match(prompt, /not catalog-style/);
    assert.match(prompt, /not product shot/);
  });

  test("photography + composition appear in order between lexicon and chips", () => {
    const prompt = assemblePrompt({
      snapshot: snapshot(),
      photography: weddingPhotography,
      composition: heroComposition,
      catalog: fixtureCatalog,
    });

    const lexiconIdx = prompt.indexOf("evocative, moody");
    const photoIdx = prompt.indexOf("fine-art wedding photography");
    const compIdx = prompt.indexOf("venue exterior");
    const banIdx = prompt.indexOf("not photoreal");

    assert.ok(lexiconIdx >= 0 && photoIdx > lexiconIdx, "photography after lexicon");
    assert.ok(compIdx > photoIdx, "composition after photography");
    assert.ok(banIdx > compIdx, "negation last");
  });

  test("category swap — corporate photography + stage composition land", () => {
    const prompt = assemblePrompt({
      snapshot: snapshot({ eventCategory: "corporate" }),
      photography: corporatePhotography,
      composition: stageComposition,
      catalog: fixtureCatalog,
    });

    assert.match(prompt, /corporate event photography/);
    assert.match(prompt, /stage with brand activation/);
    assert.doesNotMatch(prompt, /fine-art wedding photography/);
  });

  test("mood chips — promptSnippet used when set, labelEn lowercased when not", () => {
    const prompt = assemblePrompt({
      snapshot: snapshot({
        chipSelections: {
          mood: ["ethereal", "moody"],
          material: [],
          florals: [],
          typography: [],
        },
      }),
      photography: weddingPhotography,
      composition: heroComposition,
      catalog: fixtureCatalog,
    });

    // 'ethereal' chip has a promptSnippet — uses that.
    assert.match(prompt, /ethereal soft morning light/);
    // 'moody' chip has no promptSnippet — falls back to labelEn lowercased.
    assert.match(prompt, /\bmoody\b/);
    assert.match(prompt, /\bmood:/);
  });

  test("material + florals chips — each prefixed with their group label", () => {
    const prompt = assemblePrompt({
      snapshot: snapshot({
        chipSelections: {
          mood: [],
          material: ["raw-linen"],
          florals: ["pampas-grass"],
          typography: [],
        },
      }),
      photography: weddingPhotography,
      composition: heroComposition,
      catalog: fixtureCatalog,
    });

    assert.match(prompt, /materials: raw linen drape/);
    assert.match(prompt, /florals: pampas grass plumes/);
  });

  test("fabric foundation — known chip key surfaces as 'X palette in Y' phrase", () => {
    const prompt = assemblePrompt({
      snapshot: snapshot({
        fabric: {
          chipKey: "boho-pampas-cream",
          primaryColor: "#f5ecd9",
          fabricType: "linen",
        },
      }),
      photography: weddingPhotography,
      composition: heroComposition,
      catalog: fixtureCatalog,
    });

    assert.match(prompt, /boho pampas cream palette in linen/);
  });

  test("unknown chip keys — silently dropped + unknown fabric chipKey falls back to fabric type alone", () => {
    const prompt = assemblePrompt({
      snapshot: snapshot({
        fabric: {
          chipKey: "no-such-chip",
          primaryColor: "#abcdef",
          fabricType: "silk",
        },
        chipSelections: {
          mood: ["fake-mood-key"],
          material: ["fake-material-key"],
          florals: [],
          typography: [],
        },
      }),
      photography: weddingPhotography,
      composition: heroComposition,
      catalog: fixtureCatalog,
    });

    // Fabric falls back to type-alone phrasing.
    assert.match(prompt, /silk foundation/);
    // Unknown chip keys → no mood: or materials: prefix.
    assert.doesNotMatch(prompt, /\bmood:/);
    assert.doesNotMatch(prompt, /\bmaterials:/);
    // Rest of prompt intact.
    assert.match(prompt, /fine-art wedding photography/);
    assert.match(prompt, /not photoreal/);
  });
});
