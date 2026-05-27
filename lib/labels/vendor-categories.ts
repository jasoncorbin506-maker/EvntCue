/**
 * Vendor-category display labels — Lock 15 translation layer.
 *
 * Wraps `data/vndr-categories.ts` with a locale-aware accessor. UI components
 * import from here; never from `data/vndr-categories.ts` directly for display
 * strings (per the lib/labels README — DB / canonical keys speak to engineers,
 * the UI speaks to the customer).
 *
 * Sub-types are vendor-facing labels written in the same register as the
 * category names. They render in the Stage 1 chip grid (V-1b next session)
 * and in dashboard category descriptors. ES variants are stub-equivalent to
 * EN for sub-types right now — the per-sub-type ES pass lands with V-1b.
 *
 * `subTypeCueExpansion` (added 2026-05-27, PL #43): Cue-prose contexts need
 * the expanded form ("DJ or master of ceremonies") while UI chips stay terse
 * ("DJ"). Cue prompt-assembly callers route through this map; UI surfaces
 * keep the raw sub-type string.
 */

import {
  VNDR_CATEGORIES,
  type VndrCategoryKey,
} from "@/data/vndr-categories";
import type { Locale } from "@/i18n/locale";

export function vendorCategoryLabel(key: VndrCategoryKey, locale: Locale): string {
  const entry = VNDR_CATEGORIES.find((c) => c.key === key);
  if (!entry) return key;
  return locale === "es" ? entry.labelEs : entry.labelEn;
}

export function vendorCategorySubTypes(key: VndrCategoryKey): readonly string[] {
  const entry = VNDR_CATEGORIES.find((c) => c.key === key);
  return entry?.subTypes ?? [];
}

/**
 * Cue-voice expansion for vendor sub-type abbreviations. UI chips stay terse;
 * Cue prose unwraps the abbreviation when speaking to the user.
 *
 * Keys match the sub-type strings in `data/vndr-categories.ts`. Add an entry
 * when a sub-type abbreviation would read as jargon in a Cue sentence.
 * Unknown keys fall through to the original string.
 */
const SUB_TYPE_CUE_EXPANSION: Record<string, string> = {
  DJ: "DJ or master of ceremonies",
  "MC / host": "master of ceremonies or event host",
  "AV / production company": "audio-visual production company",
  "Décor rental company": "décor and tabletop rental company",
};

export function vendorSubTypeCueExpansion(subType: string): string {
  return SUB_TYPE_CUE_EXPANSION[subType] ?? subType;
}
