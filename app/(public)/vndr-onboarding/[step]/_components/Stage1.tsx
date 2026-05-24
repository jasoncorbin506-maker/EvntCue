"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  VNDR_CATEGORIES,
  type VndrCategoryKey,
} from "@/data/vndr-categories";
import { vendorCategoryLabel } from "@/lib/labels/vendor-categories";
import type { Locale } from "@/i18n/locale";
import { saveStage1Action } from "../_actions/save-stage-1";
import { CATEGORY_ICONS } from "./category-icons";
import sShell from "../vndr-onboarding-stage.module.css";
import s from "./Stage1.module.css";

/**
 * Stage 1 — What you do. Category chip grid + multi-select sub-type drill.
 *
 * Source: 02_Locked_Prototypes/Vndr/evntcue_vndr_freemium_v1.html lines
 * 782-867. Mockup uses imperative goStage(N); React version persists via
 * a server action and navigates on success.
 *
 * V-1c multi-select (migration 047). State holds an ordered array of
 * sub-types — first selected stays in position 0 as the primary specialty.
 * Toggle semantics: clicking a chip adds it to the array end if not present,
 * removes it (preserving order of remaining items) if present. Removing
 * index 0 promotes index 1 to primary.
 *
 * Visual treatment: when N > 1 the position-0 chip carries a "Primary"
 * badge. Single-selection vendors see no badge — same UX as today. Soft
 * cap at 3 is a non-blocking hint, not enforced; the schema accepts any
 * non-empty array of valid sub-types.
 *
 * Continue is enabled once a category is picked; sub-type drill is optional
 * (sub_types defaults to '{}' if vendor skips the drill).
 *
 * Initial values hydrate from props (vendor.primaryCategory /
 * primarySubTypes) so a returning user sees their prior selection
 * re-checked. primarySubTypes invariant: when non-empty, primarySubTypes[0]
 * mirrors vendors.primary_sub_type (back-compat).
 */
export function Stage1({
  initialCategory,
  initialSubTypes,
}: {
  initialCategory: string | null;
  initialSubTypes: string[];
}) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("vndr.onboarding.stages.s1");
  const tShell = useTranslations("vndr.onboarding.stages.shell");

  // Trust the initial category only if it's still in the canonical catalog
  // (defends against an old vendor row pointing at a retired category key).
  const initialCatValidated = VNDR_CATEGORIES.find(
    (c) => c.key === initialCategory,
  )?.key ?? null;

  // Trust hydrated sub-types only if they still belong to the validated
  // category's catalog. Dedupe defensively (same posture as save-stage-1).
  const initialSubTypesValidated = (() => {
    if (initialCatValidated === null) return [];
    const cat = VNDR_CATEGORIES.find((c) => c.key === initialCatValidated);
    if (!cat) return [];
    const valid = new Set<string>(cat.subTypes);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const st of initialSubTypes) {
      if (!valid.has(st) || seen.has(st)) continue;
      seen.add(st);
      out.push(st);
    }
    return out;
  })();

  const [category, setCategory] = useState<VndrCategoryKey | null>(
    initialCatValidated,
  );
  const [subTypes, setSubTypes] = useState<string[]>(initialSubTypesValidated);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedCat = category
    ? VNDR_CATEGORIES.find((c) => c.key === category)
    : null;
  const canContinue = category !== null && !pending;
  const showPrimaryBadges = subTypes.length > 1;
  const showCapHint = subTypes.length >= 3;

  const handleCategoryPick = (key: VndrCategoryKey) => {
    if (category === key) return;
    setCategory(key);
    setSubTypes([]); // reset sub-types when category changes
    setError(null);
  };

  const handleSubTypePick = (st: string) => {
    setSubTypes((cur) => {
      const idx = cur.indexOf(st);
      if (idx === -1) return [...cur, st];
      return cur.filter((s) => s !== st);
    });
  };

  const handleContinue = () => {
    if (!canContinue || category === null) return;
    setError(null);
    startTransition(async () => {
      const result = await saveStage1Action({ category, subTypes });
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      router.push("/vndr-onboarding/2");
    });
  };

  return (
    <>
      <div className={sShell.captureHead}>
        <div className={sShell.capStepMark}>
          <span>Step 1</span>
          <span className={sShell.capStepLine} aria-hidden="true" />
          <span className={sShell.capStepOf}>of 4</span>
        </div>
        <h1 className={sShell.capQ}>
          {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
        </h1>
        <p className={sShell.capDesc}>{t("description")}</p>
      </div>

      <div className={sShell.cueRead}>
        <div className={sShell.cueReadMark}>✦</div>
        <div className={sShell.cueReadBody}>
          <div className={sShell.cueReadTag}>{t("cueTag")}</div>
          <div className={sShell.cueReadTxt}>{t("cueText")}</div>
        </div>
      </div>

      <div className={s.catGrid}>
        {VNDR_CATEGORIES.map((cat) => {
          const on = category === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              className={`${s.catCard} ${on ? s.catCardOn : ""}`}
              onClick={() => handleCategoryPick(cat.key)}
              aria-pressed={on}
            >
              <div className={s.catIco}>{CATEGORY_ICONS[cat.key]}</div>
              <div className={s.catName}>
                {vendorCategoryLabel(cat.key, locale)}
              </div>
              <div className={s.catTypes}>{cat.subTypes.slice(0, 3).join(" · ")}</div>
            </button>
          );
        })}
      </div>

      {selectedCat && (
        <div className={s.subtypePanel}>
          <div className={s.subtypeH}>{t("subtypeHead")}</div>
          <div className={s.subtypeHelper}>{t("subtypeHelper")}</div>
          <div className={s.subtypeGrid}>
            {selectedCat.subTypes.map((st) => {
              const idx = subTypes.indexOf(st);
              const on = idx !== -1;
              const isPrimary = on && idx === 0 && showPrimaryBadges;
              return (
                <button
                  key={st}
                  type="button"
                  className={`${s.subtypeChip} ${on ? s.subtypeChipOn : ""}`}
                  onClick={() => handleSubTypePick(st)}
                  aria-pressed={on}
                >
                  {st}
                  {isPrimary && (
                    <span className={s.subtypePrimaryBadge}>
                      {t("primaryBadge")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {showCapHint && (
            <div className={s.subtypeCapHint}>{t("subtypeCapHint")}</div>
          )}
        </div>
      )}

      {error && (
        <div className={s.errorBanner} role="alert">
          {error}
        </div>
      )}

      <div className={sShell.capNav}>
        <span className={sShell.capMeta}>
          {canContinue ? t("metaSavedOnContinue") : t("metaPickCategory")}
        </span>
        <button
          type="button"
          className={`${sShell.btnPrimary} ${!canContinue ? sShell.btnPrimaryDisabled : ""}`}
          onClick={handleContinue}
          disabled={!canContinue}
        >
          {pending ? tShell("saving") : tShell("continue")}
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10m-4-4 4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
