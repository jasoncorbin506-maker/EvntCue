/**
 * Cue language injection helper.
 *
 * Phase 3.4 will wire `lib/cue/CueService.ts` against the Anthropic API. Until
 * then, this module owns the contract for how Cue's system prompt becomes
 * locale-aware. Any future Cue caller — preview Cue card, dashboard Cue pill,
 * 12-Min Bump triage, drill-sheet Cue voice — composes its prompt by calling
 * `cueLanguageInstruction(locale, ctx)` first.
 *
 * The English path is a no-op (returns empty). The Spanish path returns the
 * Spanish instruction from `messages/es.json` → `cue.languageInjection`, with
 * `{eventType}` / `{subtype}` interpolated from the caller's context so Cue
 * keeps cultural-specific terms in their own register (vals de quince,
 * padrinos, sangeet, pre-Cana, etc.) rather than word-for-word translation.
 *
 * Lock 14 (cultural copy boundary) still applies. The injection instructs Cue
 * to embed cultural specificity conversationally — never to concatenate
 * cultural subtype labels with money / possessive / vague event references in
 * generated copy.
 */

import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/locale";

export type CueLanguageContext = {
  eventType?: string | null;
  subtype?: string | null;
};

export async function cueLanguageInstruction(
  locale: Locale,
  ctx: CueLanguageContext = {},
): Promise<string> {
  if (locale === "en") return "";
  const t = await getTranslations({ locale, namespace: "cue" });
  return t("languageInjection", {
    eventType: ctx.eventType ?? "general",
    subtype: ctx.subtype ?? "none specified",
  });
}
