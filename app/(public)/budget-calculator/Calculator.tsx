"use client";

import { useMemo, useReducer, useState, useTransition } from "react";
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
  type LineItem,
  type Subtype,
} from "@/data/budget-presets";
import { saveAndOpenPreview } from "./_actions/save-budget-session";
import { MegaEventModal } from "./MegaEventModal";
import s from "./budget.module.css";

type Step = "category" | "subtype" | "scope" | "items";

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
  | { type: "setAmount"; key: string; amount: number }
  | { type: "applyPreset"; preset: "min" | "recommended" | "luxury" }
  | { type: "scaleBudget"; targetBudget: number }
  | { type: "setContingency"; pct: number }
  | { type: "setTax"; pct: number }
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
    case "setGuestCount":
      return { ...state, guestCount: action.count };
    case "setHorizon":
      return { ...state, dateHorizon: action.horizon };
    case "setAmount":
      return {
        ...state,
        amounts: { ...state.amounts, [action.key]: Math.max(0, Math.round(action.amount)) },
      };
    case "applyPreset": {
      if (!state.category) return state;
      const cat = CATEGORIES.find((c) => c.key === state.category)!;
      const sub = getSubtype(state.category, state.subtypeKey);
      return {
        ...state,
        amounts: seedAmounts(cat, sub, state.guestCount, action.preset),
      };
    }
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
    case "setContingency":
      return { ...state, contingencyPct: clamp(action.pct, 0, 50) };
    case "setTax":
      return { ...state, taxPct: clamp(action.pct, 0, 25) };
    case "goto":
      return { ...state, step: action.step };
  }
}

function clamp(n: number, lo: number, hi: number) {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Calculator() {
  const [state, dispatch] = useReducer(reducer, initialState);
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

  return (
    <main className={s.page}>
      <div className={s.wrap}>
        <header className={s.header}>
          <div className={s.srOnly}>Free planning tool</div>
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
              {/* 5 vertices */}
              <circle cx="39" cy="17" r="3"   fill="#D4778A" />
              <circle cx="39" cy="35" r="3"   fill="#D4778A" />
              <circle cx="20" cy="43" r="3"   fill="#D4778A" />
              <circle cx="8"  cy="26" r="3"   fill="#D4778A" />
              <circle cx="20" cy="9"  r="5"   fill="#E8A0B0" />
              <circle cx="20" cy="9"  r="2.8" fill="#F9E4EA" />
              <circle cx="20" cy="9"  r="1.1" fill="#fff" />
            </svg>
          </div>
          <h1 className={s.title}>
            <span className={s.brandWord}>
              <span className={s.brandEvnt}>Evnt</span><span className={s.brandCue}>Cue</span>
            </span>
            <span className={s.brandTitle}><em>Budget</em> Calculator</span>
          </h1>
          <p className={s.sub}>
            Real DFW pricing. Drag whatever. Math keeps up.
          </p>
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
            onNext={() => dispatch({ type: "goto", step: "items" })}
          />
        )}

        {state.step === "items" && category && (
          <ItemsStep
            category={category}
            subtype={subtype}
            state={state}
            totals={totals}
            dispatch={dispatch}
            onBack={() => dispatch({ type: "goto", step: "scope" })}
          />
        )}
      </div>
    </main>
  );
}

/* ---------- Step: Category ---------- */
function CategoryStep({ onPick }: { onPick: (c: CategoryKey) => void }) {
  return (
    <section className={s.step}>
      <h2 className={s.stepHeading}>What kind of event?</h2>
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
  const subtypes = SUBTYPES_BY_CATEGORY[category.key];
  const heading: Record<CategoryKey, string> = {
    wedding: "Which wedding tradition?",
    corporate: "Which corporate event?",
    nonprofit: "Which non-profit event?",
    public: "Which public or cultural event?",
    social: "Which social event?",
  };
  return (
    <section className={s.step}>
      <h2 className={s.stepHeading}>{heading[category.key]}</h2>
      <p className={s.subLeft}>
        We&rsquo;ll start your line items at DFW averages for that subtype, scaled to your guest count.
        You can adjust anything next.
      </p>
      <div className={s.subtypeGrid}>
        {subtypes.map((sub) => (
          <button key={sub.key} type="button" className={s.subtypeCard} onClick={() => onPick(sub.key)}>
            <div className={s.subtypeLabel}>{sub.label}</div>
            <div className={s.subtypeBlurb}>{sub.blurb}</div>
          </button>
        ))}
      </div>
      <div className={s.navRow}>
        <button className={s.btnGhost} onClick={onBack}>Back</button>
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
  onNext,
}: {
  category: Category;
  subtype: Subtype | undefined;
  state: State;
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
  onNext: () => void;
}) {
  const [megaOpen, setMegaOpen] = useState(false);
  const isMega = state.guestCount >= GUEST_SLIDER.megaThreshold;
  const stepLabel = subtype ? `${subtype.label} — scope` : `${category.label} — scope`;
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
        <label className={s.label} htmlFor="guestSlider">Guest count</label>
        <div className={s.guestDisplay}>
          <span className={s.guestVal}>{state.guestCount}</span>
          <span className={s.guestLbl}>{state.guestCount >= GUEST_SLIDER.max ? "guests +" : "guests"}</span>
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
          <div className={s.megaHint}>
            Past 500 covers, our team scopes events one-on-one — venue holds, catering tiers, AV rigging.
          </div>
        )}
      </div>

      <div className={s.fieldGroup}>
        <label className={s.label} htmlFor="budgetSlider">Total budget</label>
        <div className={s.guestDisplay}>
          <span className={s.guestVal}>{formatUSD(Math.round(subtotal))}</span>
          <span className={s.guestLbl}>{subtotal >= BUDGET_SLIDER.dollarMax ? "+" : "budget"}</span>
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
        <label className={s.label}>When is the event?</label>
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

      <div className={s.navRow}>
        <button className={s.btnGhost} onClick={onBack}>Back</button>
        {isMega ? (
          <button className={s.btnPrimary} onClick={() => setMegaOpen(true)}>
            Talk to our team →
          </button>
        ) : (
          <button className={s.btnPrimary} onClick={onNext}>Continue</button>
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
  const cls =
    overall === "danger" ? s.leadDanger : overall === "warn" ? s.leadWarn : s.leadCalm;
  const dotCls =
    overall === "danger" ? s.leadDotDanger : overall === "warn" ? s.leadDotWarn : s.leadDotCalm;
  const pulse = overall !== "calm" ? s.leadDotPulse : "";

  // Eyebrow reflects the strongest signal
  let eyebrow: string;
  if (overall === "danger") {
    if (lead === "danger") eyebrow = "Very short notice";
    else if (budget.severity === "danger") {
      eyebrow = budget.direction === "low" ? "Budget far below DFW typical" : "Luxury-tier budget";
    } else eyebrow = "Cover count outside DFW typical";
  } else if (overall === "warn") {
    if (lead === "warn") eyebrow = "Short notice";
    else if (budget.severity === "warn") {
      eyebrow = budget.direction === "low" ? "Lean budget for DFW" : "Above DFW typical budget";
    } else eyebrow = "Cover count atypical for DFW";
  } else {
    eyebrow = "Inside the DFW planning window";
  }

  return (
    <div className={`${s.leadWarning} ${cls}`}>
      <div className={`${s.leadDot} ${dotCls} ${pulse}`} aria-hidden="true" />
      <div className={s.leadCol}>
        <div className={s.leadEyebrow}>{eyebrow}</div>
        <div className={s.leadBody}>
          {/* Lead-time line */}
          {lead === "calm" ? (
            <>
              {subtypeLabel} events typically need <strong>{recLeadMonths}+ months</strong> of lead time —
              you&rsquo;re comfortably inside that window.
            </>
          ) : (
            <>
              {subtypeLabel} events typically need <strong>{recLeadMonths}+ months</strong> of lead time
              — venue holds, vendor calendars, and {lead === "danger" ? "permits" : "specialty bookings"} fill up early.
              {lead === "danger" ? " Expect a tighter shortlist and premium pricing for last-minute slots." : ""}
            </>
          )}
          {/* Cover-count line — only render when non-calm */}
          {cover.severity !== "calm" && (
            <>
              {" "}
              {cover.direction === "low" ? (
                <>
                  At <strong>{userGuests} guests</strong>, your event is much smaller than DFW typical
                  for {subtypeLabel.toLowerCase()} (~{typicalGuests} guests). Cue can scope a more
                  intimate vendor list — some packages and venue minimums won&rsquo;t apply.
                </>
              ) : (
                <>
                  At <strong>{userGuests} guests</strong>, your event runs larger than DFW typical
                  for {subtypeLabel.toLowerCase()} (~{typicalGuests} guests). Larger venues, expanded AV,
                  and tier-up catering are likely needed.
                </>
              )}
            </>
          )}
          {/* Budget per-guest line — only when non-calm and we have a typical to compare to */}
          {budget.severity !== "calm" && typicalPerGuest > 0 && (
            <>
              {" "}Per-guest at <strong>${userPerGuest}</strong> sits{" "}
              {budget.direction === "low" ? "below" : "above"} DFW typical (~${typicalPerGuest}/guest).{" "}
              {budget.direction === "low"
                ? "Vendor matches will skew budget-tier; some specialty options will be out of reach."
                : "Cue can scope premium and luxury-tier matches at this per-guest spend."}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Step: Items ---------- */
function ItemsStep({
  category,
  subtype,
  state,
  totals,
  dispatch,
  onBack,
}: {
  category: Category;
  subtype: Subtype | undefined;
  state: State;
  totals: { subtotal: number; contingency: number; tax: number; grand: number; perGuest: number; guests: number };
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
}) {
  const scale = computeScale(category, subtype, state.guestCount);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function continueToPreview() {
    setError(null);
    startTransition(async () => {
      try {
        await saveAndOpenPreview({
          category: category.key,
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
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <section className={s.stepWide}>
      <div className={s.itemsLayout}>
        <div className={s.itemsCol}>
          <h2 className={s.stepHeading}>Line items</h2>

          <div className={s.presetRow}>
            <span className={s.presetLabel}>Quick-fill:</span>
            <button type="button" className={s.presetBtn} onClick={() => dispatch({ type: "applyPreset", preset: "min" })}>Min</button>
            <button type="button" className={s.presetBtn} onClick={() => dispatch({ type: "applyPreset", preset: "recommended" })}>Recommended</button>
            <button type="button" className={s.presetBtn} onClick={() => dispatch({ type: "applyPreset", preset: "luxury" })}>Luxury</button>
          </div>

          <div className={s.itemsList}>
            {category.items.map((item) => (
              <ItemRow
                key={item.key}
                item={item}
                scale={scale}
                amount={state.amounts[item.key] ?? 0}
                onChange={(v) => dispatch({ type: "setAmount", key: item.key, amount: v })}
              />
            ))}
          </div>

          <div className={s.tunersRow}>
            <Tuner
              label="Contingency"
              suffix="%"
              value={state.contingencyPct}
              onChange={(v) => dispatch({ type: "setContingency", pct: v })}
              min={0}
              max={50}
              step={1}
            />
            <Tuner
              label="Tax"
              suffix="%"
              value={state.taxPct}
              onChange={(v) => dispatch({ type: "setTax", pct: v })}
              min={0}
              max={25}
              step={0.25}
            />
          </div>

          {error && <div className={s.errorMsg}>{error}</div>}

          <div className={s.navRow}>
            <button className={s.btnGhost} onClick={onBack} disabled={pending}>Back</button>
            <button className={s.btnPrimary} onClick={continueToPreview} disabled={pending}>
              {pending ? "Building your event…" : "View your event preview →"}
            </button>
          </div>
        </div>

        <aside className={s.totalsCol}>
          <TotalsPanel totals={totals} category={category} subtype={subtype} />
        </aside>
      </div>
    </section>
  );
}

function ItemRow({
  item,
  scale,
  amount,
  onChange,
}: {
  item: LineItem;
  scale: number;
  amount: number;
  onChange: (v: number) => void;
}) {
  const minScaled = Math.round(item.min * scale);
  const recScaled = Math.round(item.recommended * scale);
  const luxScaled = Math.round(item.luxury * scale);
  return (
    <div className={s.itemRow}>
      <div className={s.itemHead}>
        <div className={s.itemLabel}>{item.label}</div>
        <div className={s.itemHint}>
          min {formatUSD(minScaled)} · rec {formatUSD(recScaled)} · lux {formatUSD(luxScaled)}
        </div>
      </div>
      <div className={s.itemControl}>
        <span className={s.dollar}>$</span>
        <input
          className={s.itemInput}
          type="number"
          inputMode="numeric"
          min={0}
          step={50}
          value={amount}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

function Tuner({
  label,
  suffix,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className={s.tuner}>
      <span className={s.tunerLabel}>{label}</span>
      <span className={s.tunerControl}>
        <input
          className={s.tunerInput}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className={s.tunerSuffix}>{suffix}</span>
      </span>
    </label>
  );
}

/* ---------- Totals panel ---------- */
function TotalsPanel({
  totals,
  category,
  subtype,
}: {
  totals: { subtotal: number; contingency: number; tax: number; grand: number; perGuest: number; guests: number };
  category: Category;
  subtype: Subtype | undefined;
}) {
  return (
    <div className={s.totalsCard}>
      <div className={s.totalsEyebrow}>{(subtype?.label ?? category.label) + " budget"}</div>
      <div className={s.totalsGrand}>{formatUSD(totals.grand)}</div>
      <div className={s.totalsPerGuest}>
        {formatUSD(totals.perGuest)} per guest · {totals.guests} guests
      </div>

      <div className={s.totalsBreakdown}>
        <div className={s.totalsRow}>
          <span>Subtotal</span>
          <span>{formatUSD(totals.subtotal)}</span>
        </div>
        <div className={s.totalsRow}>
          <span>Contingency</span>
          <span>{formatUSD(totals.contingency)}</span>
        </div>
        <div className={s.totalsRow}>
          <span>Tax</span>
          <span>{formatUSD(totals.tax)}</span>
        </div>
      </div>
    </div>
  );
}
