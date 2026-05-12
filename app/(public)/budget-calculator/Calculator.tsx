"use client";

import { useMemo, useReducer, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { LangToggle } from "@/app/_components/LangToggle";
import {
  CATEGORIES,
  DATE_HORIZONS,
  DEFAULTS,
  BUDGET_SLIDER,
  GUEST_SLIDER,
  SUBTYPES_BY_CATEGORY,
  budgetSeverity,
  budgetToSlider,
  combinedSeverity,
  coverSeverity,
  getSubtype,
  guestBandFromCount,
  leadTimeSeverity,
  sliderToBudget,
  type BudgetSeverity,
  type Category,
  type CategoryKey,
  type CoverSeverity,
  type DateHorizon,
  type LeadTimeSeverity,
  type Subtype,
} from "@/data/budget-presets";
import { saveAndOpenPreview } from "./_actions/save-budget-session";
import { MegaEventModal } from "./MegaEventModal";
import s from "./budget.module.css";

type Step = "category" | "subtype" | "scope";

type State = {
  step: Step;
  category: CategoryKey | null;
  subtypeKey: string | null;
  guestCount: number;
  dateHorizon: DateHorizon;
  amounts: Record<string, number>;
  contingencyPct: number;
  taxPct: number;
};

type Action =
  | { type: "pickCategory"; category: CategoryKey }
  | { type: "pickSubtype"; subtypeKey: string }
  | { type: "setGuestCount"; count: number }
  | { type: "setHorizon"; horizon: DateHorizon }
  | { type: "scaleBudget"; targetBudget: number }
  | { type: "goto"; step: Step };

const initialState: State = {
  step: "category",
  category: null,
  subtypeKey: null,
  guestCount: GUEST_SLIDER.default,
  dateHorizon: "6_8",
  amounts: {},
  contingencyPct: DEFAULTS.contingencyPct,
  taxPct: DEFAULTS.taxPct,
};

function computeScale(category: Category, subtype: Subtype | undefined, actualGuests: number): number {
  const baseTotal = subtype ? subtype.recommendedTotal : category.recommendedTotal;
  const typical = subtype ? subtype.typicalGuests : category.typicalGuests;
  if (typical <= 0) return 1;
  return (baseTotal / category.recommendedTotal) * (actualGuests / typical);
}

function seedAmounts(
  category: Category,
  subtype: Subtype | undefined,
  actualGuests: number,
  preset: "min" | "recommended" | "luxury",
): Record<string, number> {
  const scale = computeScale(category, subtype, actualGuests);
  const out: Record<string, number> = {};
  for (const it of category.items) out[it.key] = Math.round(it[preset] * scale);
  return out;
}

function clampGuests(n: number) {
  return Math.min(GUEST_SLIDER.max, Math.max(GUEST_SLIDER.min, n));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "pickCategory": {
      const cat = CATEGORIES.find((c) => c.key === action.category)!;
      return {
        ...state,
        category: action.category,
        subtypeKey: null,
        amounts: seedAmounts(cat, undefined, state.guestCount, "recommended"),
        step: "subtype",
      };
    }
    case "pickSubtype": {
      if (!state.category) return state;
      const cat = CATEGORIES.find((c) => c.key === state.category)!;
      const sub = getSubtype(state.category, action.subtypeKey);
      if (!sub) return state;
      const newGuests = clampGuests(sub.typicalGuests);
      return {
        ...state,
        subtypeKey: action.subtypeKey,
        guestCount: newGuests,
        amounts: seedAmounts(cat, sub, newGuests, "recommended"),
        step: "scope",
      };
    }
    case "setGuestCount": {
      // Rescale line items so per-guest dollar stays anchored at the subtype's
      // typical $/head — keeps the budget meaningful as the user drags guests.
      if (!state.category) return { ...state, guestCount: action.count };
      const cat = CATEGORIES.find((c) => c.key === state.category)!;
      const sub = getSubtype(state.category, state.subtypeKey);
      return {
        ...state,
        guestCount: action.count,
        amounts: seedAmounts(cat, sub, action.count, "recommended"),
      };
    }
    case "setHorizon":
      return { ...state, dateHorizon: action.horizon };
    case "scaleBudget": {
      if (!state.category) return state;
      const target = Math.max(0, action.targetBudget);
      const currentSubtotal = Object.values(state.amounts).reduce(
        (a, b) => a + (Number.isFinite(b) ? b : 0),
        0,
      );
      // If current line items are empty, reseed from category baseline scaled to target
      if (currentSubtotal <= 0) {
        const cat = CATEGORIES.find((c) => c.key === state.category)!;
        const baseline = cat.recommendedTotal;
        const scale = baseline > 0 ? target / baseline : 0;
        const out: Record<string, number> = {};
        for (const it of cat.items) out[it.key] = Math.round(it.recommended * scale);
        return { ...state, amounts: out };
      }
      const scale = target / currentSubtotal;
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(state.amounts)) out[k] = Math.round(v * scale);
      return { ...state, amounts: out };
    }
    case "goto":
      return { ...state, step: action.step };
  }
}

function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Calculator() {
  const t = useTranslations("calculator");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const category = state.category ? CATEGORIES.find((c) => c.key === state.category)! : null;
  const subtype = state.category ? getSubtype(state.category, state.subtypeKey) : undefined;

  const totals = useMemo(() => {
    const subtotal = Object.values(state.amounts).reduce(
      (a, b) => a + (Number.isFinite(b) ? b : 0),
      0,
    );
    const contingency = Math.round(subtotal * (state.contingencyPct / 100));
    const tax = Math.round(subtotal * (state.taxPct / 100));
    const grand = subtotal + contingency + tax;
    const guests = state.guestCount;
    const perGuest = guests > 0 ? Math.round(grand / guests) : 0;
    return { subtotal, contingency, tax, grand, perGuest, guests };
  }, [state.amounts, state.contingencyPct, state.taxPct, state.guestCount]);

  function continueToPreview() {
    if (!state.category) return;
    setSaveError(null);
    startTransition(async () => {
      try {
        await saveAndOpenPreview({
          category: state.category!,
          subtypeKey: state.subtypeKey,
          guestCount: state.guestCount,
          dateHorizon: state.dateHorizon,
          guestBand: guestBandFromCount(state.guestCount),
          amounts: state.amounts,
          contingencyPct: state.contingencyPct,
          taxPct: state.taxPct,
          subtotal: totals.subtotal,
          contingency: totals.contingency,
          tax: totals.tax,
          grand: totals.grand,
        });
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <main className={s.page}>
      <div className={s.wrap}>
        <div className={s.langCorner}>
          <LangToggle />
        </div>
        <header className={s.header}>
          <div className={s.srOnly}>{t("eyebrow")}</div>
          <div className={s.brandStage} aria-hidden="true">
            <svg className={s.brandLogo} viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
              {/* outer pentagon edges */}
              <line x1="20" y1="9"  x2="39" y2="17" stroke="#D4778A" strokeWidth="1.5" strokeOpacity="0.65" />
              <line x1="39" y1="17" x2="39" y2="35" stroke="#D4778A" strokeWidth="1.5" strokeOpacity="0.65" />
              <line x1="39" y1="35" x2="20" y2="43" stroke="#D4778A" strokeWidth="1.5" strokeOpacity="0.65" />
              <line x1="20" y1="43" x2="8"  y2="26" stroke="#D4778A" strokeWidth="1.5" strokeOpacity="0.65" />
              <line x1="8"  y1="26" x2="20" y2="9"  stroke="#D4778A" strokeWidth="1.5" strokeOpacity="0.65" />
              {/* interior diagonals */}
              <line x1="20" y1="9"  x2="39" y2="35" stroke="#D4A0B8" strokeWidth="0.8" strokeOpacity="0.25" />
              <line x1="20" y1="9"  x2="20" y2="43" stroke="#D4A0B8" strokeWidth="0.8" strokeOpacity="0.25" />
              <line x1="39" y1="17" x2="20" y2="43" stroke="#D4A0B8" strokeWidth="0.8" strokeOpacity="0.25" />
              <line x1="39" y1="17" x2="8"  y2="26" stroke="#D4A0B8" strokeWidth="0.8" strokeOpacity="0.25" />
              <line x1="39" y1="35" x2="8"  y2="26" stroke="#D4A0B8" strokeWidth="0.8" strokeOpacity="0.25" />
              {/* 5 vertices — one per portal, clockwise from top:
                  Orgnz · Plnr · Vndr · Catr · Venu */}
              <circle cx="39" cy="17" r="3"   fill="#AFA9EC" />{/* Plnr — violet */}
              <circle cx="39" cy="35" r="3"   fill="#E8622A" />{/* Vndr — coral */}
              <circle cx="20" cy="43" r="3"   fill="#C98A1A" />{/* Catr — amber */}
              <circle cx="8"  cy="26" r="3"   fill="#2A6BDB" />{/* Venu — blue  */}
              {/* Orgnz apex — haloed (also Cue voice prime) */}
              <circle cx="20" cy="9"  r="5"   fill="#E8A0B0" />
              <circle cx="20" cy="9"  r="2.8" fill="#F9E4EA" />
              <circle cx="20" cy="9"  r="1.1" fill="#fff" />
            </svg>
          </div>
          <h1 className={s.title}>
            <span className={s.brandWord}>
              <span className={s.brandEvnt}>Evnt</span><span className={s.brandCue}>Cue</span>
            </span>
            <span className={s.brandTitle}>
              {t.rich("title", { em: (chunks) => <em>{chunks}</em> })}
            </span>
          </h1>
          <p className={s.sub}>{t("sub")}</p>
        </header>

        {state.step === "category" && (
          <CategoryStep onPick={(c) => dispatch({ type: "pickCategory", category: c })} />
        )}

        {state.step === "subtype" && category && (
          <SubtypeStep
            category={category}
            onPick={(k) => dispatch({ type: "pickSubtype", subtypeKey: k })}
            onBack={() => dispatch({ type: "goto", step: "category" })}
          />
        )}

        {state.step === "scope" && category && (
          <ScopeStep
            category={category}
            subtype={subtype}
            state={state}
            dispatch={dispatch}
            onBack={() => dispatch({ type: "goto", step: "subtype" })}
            onContinue={continueToPreview}
            pending={pending}
            saveError={saveError}
          />
        )}
      </div>
    </main>
  );
}

/* ---------- Step: Category ---------- */
function CategoryStep({ onPick }: { onPick: (c: CategoryKey) => void }) {
  const t = useTranslations("calculator");
  return (
    <section className={s.step}>
      <h2 className={s.stepHeading}>{t("categoryHeading")}</h2>
      <div className={s.categoryGrid}>
        {CATEGORIES.map((c) => (
          <button key={c.key} type="button" className={s.categoryCard} onClick={() => onPick(c.key)}>
            <div className={s.categoryLabel}>{c.label}</div>
            <div className={s.categoryBlurb}>{c.blurb}</div>
            <div className={s.categoryAvg}>
              <strong>{formatUSD(c.recommendedTotal)}</strong>
              <span className={s.arrow}>→</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- Step: Subtype ---------- */
function SubtypeStep({
  category,
  onPick,
  onBack,
}: {
  category: Category;
  onPick: (k: string) => void;
  onBack: () => void;
}) {
  const t = useTranslations("calculator");
  const subtypes = SUBTYPES_BY_CATEGORY[category.key];
  return (
    <section className={s.step}>
      <h2 className={s.stepHeading}>{t(`subtypeHeading.${category.key}`)}</h2>
      <p className={s.subLeft}>{t("subtypeSub")}</p>
      <div className={s.subtypeGrid}>
        {subtypes.map((sub) => (
          <button key={sub.key} type="button" className={s.subtypeCard} onClick={() => onPick(sub.key)}>
            <div className={s.subtypeLabel}>{sub.label}</div>
            <div className={s.subtypeBlurb}>{sub.blurb}</div>
          </button>
        ))}
      </div>
      <div className={s.navRow}>
        <button className={s.btnGhost} onClick={onBack}>{t("back")}</button>
        <span />
      </div>
    </section>
  );
}

/* ---------- Step: Scope ---------- */
function ScopeStep({
  category,
  subtype,
  state,
  dispatch,
  onBack,
  onContinue,
  pending,
  saveError,
}: {
  category: Category;
  subtype: Subtype | undefined;
  state: State;
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
  onContinue: () => void;
  pending: boolean;
  saveError: string | null;
}) {
  const t = useTranslations("calculator");
  const [megaOpen, setMegaOpen] = useState(false);
  const isMega = state.guestCount >= GUEST_SLIDER.megaThreshold;
  const stepLabel = t("scopeLabel", { label: subtype ? subtype.label : category.label });
  const recLead = subtype?.recommendedLeadMonths ?? category.recommendedLeadMonths;
  const typicalGuests = subtype?.typicalGuests ?? category.typicalGuests;
  const subtotal = Object.values(state.amounts).reduce(
    (a, b) => a + (Number.isFinite(b) ? b : 0),
    0,
  );
  const perGuest = state.guestCount > 0 ? subtotal / state.guestCount : 0;
  const anchorTotalForBudget = subtype?.recommendedTotal ?? category.recommendedTotal;
  const typicalPerGuest = typicalGuests > 0 ? anchorTotalForBudget / typicalGuests : 0;
  const lead = leadTimeSeverity(state.dateHorizon, recLead);
  const cover = coverSeverity(state.guestCount, typicalGuests);
  const budget = budgetSeverity(perGuest, typicalPerGuest);
  const overall = combinedSeverity(lead, cover.severity, budget.severity);
  return (
    <section className={s.step}>
      <h2 className={s.stepHeading}>{stepLabel}</h2>

      <div className={s.fieldGroup}>
        <label className={s.label} htmlFor="guestSlider">{t("guestCountLabel")}</label>
        <div className={s.guestDisplay}>
          <span className={s.guestVal}>{state.guestCount}</span>
          <span className={s.guestLbl}>{state.guestCount >= GUEST_SLIDER.max ? t("guestsUnitPlus") : t("guestsUnit")}</span>
        </div>
        <input
          id="guestSlider"
          type="range"
          className={s.slider}
          min={GUEST_SLIDER.min}
          max={GUEST_SLIDER.max}
          step={GUEST_SLIDER.step}
          value={state.guestCount}
          onChange={(e) => dispatch({ type: "setGuestCount", count: Number(e.target.value) })}
        />
        <div className={s.sliderTicks}>
          <span>{GUEST_SLIDER.min}</span>
          <span>50</span>
          <span>100</span>
          <span>250</span>
          <span>{GUEST_SLIDER.max}+</span>
        </div>
        {isMega && (
          <div className={s.megaHint}>{t("megaHint")}</div>
        )}
      </div>

      <div className={s.fieldGroup}>
        <label className={s.label} htmlFor="budgetSlider">{t("totalBudgetLabel")}</label>
        <div className={s.guestDisplay}>
          <span className={s.guestVal}>{formatUSD(Math.round(subtotal))}</span>
          <span className={s.guestLbl}>{subtotal >= BUDGET_SLIDER.dollarMax ? "+" : t("budgetUnit")}</span>
        </div>
        <input
          id="budgetSlider"
          type="range"
          className={s.slider}
          min={0}
          max={BUDGET_SLIDER.units}
          step={1}
          value={budgetToSlider(subtotal)}
          onChange={(e) =>
            dispatch({ type: "scaleBudget", targetBudget: sliderToBudget(Number(e.target.value)) })
          }
        />
        <div className={s.sliderTicks}>
          <span>$1K</span>
          <span>$5K</span>
          <span>$25K</span>
          <span>$100K</span>
          <span>$500K+</span>
        </div>
      </div>

      <div className={s.fieldGroup}>
        <label className={s.label}>{t("whenLabel")}</label>
        <div className={s.chipRow}>
          {DATE_HORIZONS.map((d) => (
            <button
              key={d.value}
              type="button"
              className={`${s.chip} ${state.dateHorizon === d.value ? s.chipActive : ""}`}
              onClick={() => dispatch({ type: "setHorizon", horizon: d.value })}
            >
              {d.label}
            </button>
          ))}
        </div>
        <ScopeWarning
          overall={overall}
          lead={lead}
          cover={cover}
          budget={budget}
          recLeadMonths={recLead}
          typicalGuests={typicalGuests}
          userGuests={state.guestCount}
          userPerGuest={Math.round(perGuest)}
          typicalPerGuest={Math.round(typicalPerGuest)}
          subtypeLabel={subtype?.label ?? category.label}
        />
      </div>

      {saveError && <div className={s.errorMsg}>{saveError}</div>}

      <div className={s.navRow}>
        <button className={s.btnGhost} onClick={onBack} disabled={pending}>{t("back")}</button>
        {isMega ? (
          <button className={s.btnPrimary} onClick={() => setMegaOpen(true)}>
            {t("talkToTeam")}
          </button>
        ) : (
          <button className={s.btnPrimary} onClick={onContinue} disabled={pending}>
            {pending ? t("building") : t("viewPreview")}
          </button>
        )}
      </div>

      {megaOpen && (
        <MegaEventModal
          category={category.key}
          subtypeKey={state.subtypeKey}
          dateHorizon={state.dateHorizon}
          onClose={() => setMegaOpen(false)}
        />
      )}
    </section>
  );
}

function ScopeWarning({
  overall,
  lead,
  cover,
  budget,
  recLeadMonths,
  typicalGuests,
  userGuests,
  userPerGuest,
  typicalPerGuest,
  subtypeLabel,
}: {
  overall: LeadTimeSeverity;
  lead: LeadTimeSeverity;
  cover: CoverSeverity;
  budget: BudgetSeverity;
  recLeadMonths: number;
  typicalGuests: number;
  userGuests: number;
  userPerGuest: number;
  typicalPerGuest: number;
  subtypeLabel: string;
}) {
  const t = useTranslations("calculator.warning");
  const cls =
    overall === "danger" ? s.leadDanger : overall === "warn" ? s.leadWarn : s.leadCalm;
  const dotCls =
    overall === "danger" ? s.leadDotDanger : overall === "warn" ? s.leadDotWarn : s.leadDotCalm;
  const pulse = overall !== "calm" ? s.leadDotPulse : "";

  // Eyebrow reflects the strongest signal
  let eyebrow: string;
  if (overall === "danger") {
    if (lead === "danger") eyebrow = t("veryShort");
    else if (budget.severity === "danger") {
      eyebrow = budget.direction === "low" ? t("budgetFarBelow") : t("budgetLuxury");
    } else eyebrow = t("coverOutside");
  } else if (overall === "warn") {
    if (lead === "warn") eyebrow = t("shortNotice");
    else if (budget.severity === "warn") {
      eyebrow = budget.direction === "low" ? t("budgetLean") : t("budgetAbove");
    } else eyebrow = t("coverAtypical");
  } else {
    eyebrow = t("calm");
  }

  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  return (
    <div className={`${s.leadWarning} ${cls}`}>
      <div className={`${s.leadDot} ${dotCls} ${pulse}`} aria-hidden="true" />
      <div className={s.leadCol}>
        <div className={s.leadEyebrow}>{eyebrow}</div>
        <div className={s.leadBody}>
          {/* Lead-time line */}
          {lead === "calm"
            ? t.rich("leadCalm", { label: subtypeLabel, months: recLeadMonths, strong })
            : lead === "danger"
              ? t.rich("leadTightDanger", { label: subtypeLabel, months: recLeadMonths, strong })
              : t.rich("leadTightWarn", { label: subtypeLabel, months: recLeadMonths, strong })}
          {/* Cover-count line — only render when non-calm */}
          {cover.severity !== "calm" && (
            <>
              {" "}
              {cover.direction === "low"
                ? t.rich("coverLow", { guests: userGuests, label: subtypeLabel.toLowerCase(), typical: typicalGuests, strong })
                : t.rich("coverHigh", { guests: userGuests, label: subtypeLabel.toLowerCase(), typical: typicalGuests, strong })}
            </>
          )}
          {/* Budget per-guest line — only when non-calm and we have a typical to compare to */}
          {budget.severity !== "calm" && typicalPerGuest > 0 && (
            <>
              {" "}
              {t("perGuestPrefix", { perGuest: userPerGuest })}{" "}
              {budget.direction === "low" ? t("below") : t("above")}{" "}
              {t("perGuestSuffix", { typical: typicalPerGuest })}{" "}
              {budget.direction === "low" ? t("budgetLowTail") : t("budgetHighTail")}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
