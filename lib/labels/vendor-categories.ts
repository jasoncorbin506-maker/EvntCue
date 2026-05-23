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
