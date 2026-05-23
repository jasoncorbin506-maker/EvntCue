/**
 * Mood Board prompt assembler — v1 (Chunk D Step 3b).
 *
 * Pure function. No DB, no internal value imports. Takes a BoardSnapshot
 * (from lib/moodboard/board-snapshot.ts) and the per-category photography +
 * composition strings (caller looks these up from data/moodboard/slots.ts)
 * plus the per-category ChipPalette (caller looks this up from
 * data/moodboard/byCategory) and returns the prompt string the server
 * action passes to RenderService.runRender.
 *
 * Per Lock 21 — structurally enforces inspirational-not-hyperreal framing:
 *   1. Editorial-lexicon PREPEND (non-negotiable, fixed across categories).
 *   2. Photography modifier (per category — caller-provided).
 *   3. Composition recipe (per category × slot — caller-provided).
 *   4. Chip-derived modifiers (fabric + mood + material + florals).
 *   5. Banned-vocab negation (non-negotiable, fixed across categories).
 *
 * v1 simplifications (polish-pass targets, not bugs):
 *   - Heuristic prompt — no Anthropic API / Cue voice integration yet.
 *   - Typography chips IGNORED — typography belongs to the layout caption
 *     (Cormorant footer per Lock 21), not the image prompt.
 *   - Unknown chip keys silently dropped — we don't fail a render because a
 *     chip rotated out of the catalog between selection and render.
 *
 * Imports follow the project convention for tested files (see Chunk C's
 * pinterest-import.ts pattern): type-only imports of internal modules
 * (erased by --experimental-strip-types, never resolved by Node) +
 * external packages. Zero internal value imports so the test runner can
 * load this file without pulling in extension-less internal chains.
 */

import type { BoardSnapshot } from "../moodboard/board-snapshot.ts";
import type { ChipPalette } from "../../data/moodboard/types.ts";

/** Fixed editorial lexicon — Lock 21, non-negotiable. */
const EDITORIAL_LEXICON =
  "evocative, moody, soft focus, painterly, atmospheric, magazine-spread mood";

/** Fixed negation phrasing — Lock 21, non-negotiable. Embedded inline as
 *  natural language so it works against any text-to-image model. */
const BANNED_NEGATION =
  "not photoreal, not hyperreal, not catalog-style, not product shot, not exact reproduction";

export interface AssemblePromptInput {
  snapshot: BoardSnapshot;
  /** Per-category photography modifier (caller looks up
   *  PHOTOGRAPHY_BY_CATEGORY from data/moodboard/slots). */
  photography: string;
  /** Per-category × slot composition recipe (caller looks up
   *  compositionForSlot from data/moodboard/slots). */
  composition: string;
  /** Per-category chip catalog (caller looks up byCategory from
   *  data/moodboard) — needed to resolve chip keys to natural-language
   *  prompt phrases. */
  catalog: ChipPalette;
}

/**
 * Assemble the prompt for one slot. Returns a single-line string ready
 * to pass into RenderService.runRender as the prompt input.
 */
export function assemblePrompt(input: AssemblePromptInput): string {
  const chipModifiers = collectChipModifiers(input.snapshot, input.catalog);

  // Parts joined with " · " separators for legibility (no commas/periods
  // inside a part — clean phrase boundaries).
  const parts = [
    EDITORIAL_LEXICON,
    input.photography,
    input.composition,
    ...chipModifiers,
    BANNED_NEGATION,
  ];

  return parts.filter((p) => p.length > 0).join(" · ");
}

/**
 * Collect chip-derived modifiers as natural-language phrases. Order:
 * fabric → mood → material → florals. Typography skipped per v1
 * simplification.
 */
function collectChipModifiers(
  snapshot: BoardSnapshot,
  catalog: ChipPalette,
): string[] {
  const out: string[] = [];

  // Fabric foundation (one selected palette chip per board, if any).
  if (snapshot.fabric) {
    const chip = catalog.palette.find((p) => p.key === snapshot.fabric!.chipKey);
    if (chip) {
      out.push(`${chip.labelEn.toLowerCase()} palette in ${snapshot.fabric.fabricType}`);
    } else {
      // Unknown chip key — fall back to fabric type alone.
      out.push(`${snapshot.fabric.fabricType} foundation`);
    }
  }

  // Mood chips.
  const moodPhrases = lookupChipPhrases(
    snapshot.chipSelections.mood,
    catalog.mood,
  );
  if (moodPhrases.length > 0) {
    out.push(`mood: ${moodPhrases.join(", ")}`);
  }

  // Material chips.
  const materialPhrases = lookupChipPhrases(
    snapshot.chipSelections.material,
    catalog.material,
  );
  if (materialPhrases.length > 0) {
    out.push(`materials: ${materialPhrases.join(", ")}`);
  }

  // Florals chips.
  const floralsPhrases = lookupChipPhrases(
    snapshot.chipSelections.florals,
    catalog.florals,
  );
  if (floralsPhrases.length > 0) {
    out.push(`florals: ${floralsPhrases.join(", ")}`);
  }

  return out;
}

/**
 * Map selected chip keys to natural-language phrases. Prefers a chip's
 * `promptSnippet` when set; falls back to `labelEn` lowercased. Unknown
 * keys silently dropped (resilience against catalog churn).
 */
function lookupChipPhrases(
  selectedKeys: string[],
  catalog: Array<{ key: string; labelEn: string; promptSnippet?: string }>,
): string[] {
  return selectedKeys
    .map((key) => catalog.find((c) => c.key === key))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)
    .map((c) => c.promptSnippet ?? c.labelEn.toLowerCase());
}
