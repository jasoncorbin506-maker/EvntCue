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
 * Stage 1 — What you do. Category chip grid + optional sub-type drill.
 *
 * Source: 02_Locked_Prototypes/Vndr/evntcue_vndr_freemium_v1.html lines
 * 782-867. Mockup uses imperative goStage(N); React version persists via
 * a server action and navigates on success.
 *
 * State: selectedCategory + selectedSubType. Continue is enabled once a
 * category is picked; sub-type drill is optional (the column is nullable,
 * Stage 4 falls back to category-based reveal when sub_type is NULL).
 *
 * Initial values hydrate from props (vendor.primaryCategory / primarySubType)
 * so a returning user sees their prior selection re-checked.
 */
export function Stage1({
  initialCategory,
  initialSubType,
}: {
  initialCategory: string | null;
  initialSubType: string | null;
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

  const [category, setCategory] = useState<VndrCategoryKey | null>(
    initialCatValidated,
  );
  const [subType, setSubType] = useState<string | null>(initialSubType);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedCat = category
    ? VNDR_CATEGORIES.find((c) => c.key === category)
    : null;
  const canContinue = category !== null && !pending;

  const handleCategoryPick = (key: VndrCategoryKey) => {
    if (category === key) return;
    setCategory(key);
    setSubType(null); // reset sub-type when category changes
    setError(null);
  };

  const handleSubTypePick = (st: string) => {
    setSubType((cur) => (cur === st ? null : st));
  };

  const handleContinue = () => {
    if (!canContinue || category === null) return;
    setError(null);
    startTransition(async () => {
      const result = await saveStage1Action({ category, subType });
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
          <div className={s.subtypeGrid}>
            {selectedCat.subTypes.map((st) => {
              const on = subType === st;
              return (
                <button
                  key={st}
                  type="button"
                  className={`${s.subtypeChip} ${on ? s.subtypeChipOn : ""}`}
                  onClick={() => handleSubTypePick(st)}
                  aria-pressed={on}
                >
                  {st}
                </button>
              );
            })}
          </div>
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
