"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CommissionBreakdownDisclosure } from "@/app/_components/CommissionBreakdownDisclosure";
import { COMMISSION_RATES } from "@/data/commission-rates";
import s from "./vndr-onboarding.module.css";
import { saveAndAdvance, type SaveVndrSessionPayload } from "./_actions/save-vndr-session";

/**
 * Stage 0 Vndr take-home calculator. Mobile-first stacked columns at 390px;
 * the two columns (Listed / Pro) stack vertically below 480px to keep the
 * §75 one-glance rule honest — at narrow widths the eye reads "you keep $X"
 * one card at a time, not as a side-by-side spreadsheet.
 *
 * Math — Lock 25 v2a (2026-05-24) — see decisions-log/2026-05-24-pricing-model-v2a.md:
 *
 *   Vndr Free total fee:  amt × 0.075   (7.5% consolidated; payment processing included)
 *   Vndr Pro total fee:   amt × 0.06    (6%   consolidated; payment processing included)
 *   Vndr Pro subscription: $129/mo
 *
 * Replaces the prior per-amount-tiered math (5%/4%/3% Listed × 3%/3%/2% Pro
 * + 2.5% platform fee) which was the pre-Lock-25 placeholder per
 * PARKING_LOT #21. The flat-rate model honors Lock 25's consolidated-fee
 * presentation rule — one number, processing baked in — and aligns with
 * the CommissionBreakdownDisclosure mounted below.
 *
 * Reference smoke value (Lock 25 v2a): slider=55 → amt $5,000 → Listed
 * $4,625 (5000×0.925) / Pro $4,700 (5000×0.94) / delta $75/booking.
 *
 * The CTA button submits the live slider state to a server action that
 * persists to landing_capture_sessions then redirects to /login with the
 * vndr role + claim_listing intent (V-1b will pick up the row on first
 * authed request).
 */

const SLIDER_MIN = 0;
const SLIDER_MAX = 100;
const SLIDER_DEFAULT = 55;
const LN_500 = Math.log(500);
const LN_30K = Math.log(30000);

// Lock 25 v2a — consolidated rates (processing included).
const VNDR_FREE_RATE = COMMISSION_RATES.vndr.free.commissionRate ?? 0.075;
const VNDR_PRO_RATE = COMMISSION_RATES.vndr.pro.commissionRate ?? 0.06;
const PRO_MONTHLY = COMMISSION_RATES.vndr.pro.monthlyPrice ?? 129;

function bookingFromSlider(v: number): number {
  const val = Math.exp(LN_500 + (LN_30K - LN_500) * (v / 100));
  if (val < 1000) return Math.round(val / 50) * 50;
  if (val < 5000) return Math.round(val / 100) * 100;
  if (val < 15000) return Math.round(val / 250) * 250;
  return Math.round(val / 500) * 500;
}

function fmtCalc(n: number): string {
  if (n >= 25000) return "$25K+";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function feeOn(amt: number, isPro: boolean): number {
  return amt * (isPro ? VNDR_PRO_RATE : VNDR_FREE_RATE);
}

type TierPreference = "listed" | "pro" | null;

export function Calculator() {
  const t = useTranslations("vndr.onboarding.calc");
  const tCta = useTranslations("vndr.onboarding.cta");
  const [sliderValue, setSliderValue] = useState<number>(SLIDER_DEFAULT);
  const [tierPreference, setTierPreference] = useState<TierPreference>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const view = useMemo(() => {
    const amt = bookingFromSlider(sliderValue);
    const freeFee = feeOn(amt, false);
    const proFee = feeOn(amt, true);
    const freeKeep = amt - freeFee;
    const proKeep = amt - proFee;
    const savings = proFee < freeFee ? freeFee - proFee : 0;
    return { amt, freeFee, proFee, freeKeep, proKeep, savings };
  }, [sliderValue]);

  const delta = useMemo(() => {
    if (view.savings === 0) {
      return t("deltaSameSize");
    }
    const monthlyBreakeven = Math.ceil(PRO_MONTHLY / view.savings);
    const frequency =
      monthlyBreakeven === 1
        ? t("deltaFrequencyOne")
        : t("deltaFrequencyN", { count: monthlyBreakeven });
    return t("deltaSavings", { amount: fmtCalc(view.savings), frequency });
  }, [view.savings, t]);

  const onSubmit = useCallback(() => {
    setError(null);
    const payload: SaveVndrSessionPayload = {
      bookingAmount: view.amt,
      sliderValue,
      tierPreference,
    };
    startTransition(async () => {
      const result = await saveAndAdvance(payload);
      if (result.ok === false) {
        setError(result.error);
      }
      // ok=true triggers a server-side redirect that the action throws —
      // we never see it here.
    });
  }, [sliderValue, tierPreference, view.amt]);

  return (
    <section className={s.calcSection} id="calc">
      <div className={s.calcHead}>
        <div className={s.calcEye}>{t("eye")}</div>
        <h2 className={s.calcH}>
          {t.rich("headline", {
            booking: () => <em>{fmtCalc(view.amt)}</em>,
            keep: () => <em>{fmtCalc(view.freeKeep)}</em>,
          })}
        </h2>
        <p className={s.calcSub}>{t("sub")}</p>
      </div>

      <div className={s.calcCard}>
        <div className={s.calcSliderRow}>
          <span className={s.calcLbl}>{t("yourBooking")}</span>
          <span className={s.calcBooking}>{fmtCalc(view.amt)}</span>
        </div>
        <input
          type="range"
          className={s.calcSlider}
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={1}
          value={sliderValue}
          onChange={(e) => setSliderValue(parseInt(e.target.value, 10))}
          // CSS reads --track-pct on the WebKit slider runnable track to
          // paint the coral fill from 0% → thumb position. Without this
          // inline style, the var falls back to its CSS default (55%) and
          // the orange line freezes there no matter where you drag the
          // thumb. Slider value is 0-100 so the percent maps 1:1.
          style={{ "--track-pct": `${sliderValue}%` } as React.CSSProperties}
          aria-label={t("sliderAria")}
        />
        <div className={s.calcTicks}>
          <span>$500</span>
          <span>$2K</span>
          <span>$5K</span>
          <span>$15K</span>
          <span>$25K+</span>
        </div>

        <div className={s.calcGrid}>
          <button
            type="button"
            className={`${s.calcCol} ${tierPreference === "listed" ? s.calcColActive : ""}`}
            onClick={() =>
              setTierPreference((prev) => (prev === "listed" ? null : "listed"))
            }
            aria-pressed={tierPreference === "listed"}
          >
            <div className={s.calcColTag}>{t("col.listed")}</div>
            <div className={s.calcKeep}>{fmtCalc(view.freeKeep)}</div>
            <div className={s.calcKeepL}>{t("youKeep")}</div>
            <div className={s.calcFee}>
              {fmtCalc(view.freeFee)} {t("fee")}
            </div>
          </button>

          <button
            type="button"
            className={`${s.calcCol} ${s.calcColPro} ${tierPreference === "pro" ? s.calcColActive : ""}`}
            onClick={() =>
              setTierPreference((prev) => (prev === "pro" ? null : "pro"))
            }
            aria-pressed={tierPreference === "pro"}
          >
            <div className={s.calcColTagPro}>{t("col.pro")}</div>
            <div className={`${s.calcKeep} ${s.calcKeepPro}`}>{fmtCalc(view.proKeep)}</div>
            <div className={s.calcKeepL}>{t("youKeep")}</div>
            <div className={s.calcFee}>
              {fmtCalc(view.proFee)} {t("fee")}
            </div>
          </button>
        </div>

        <p className={s.calcDelta}>{delta}</p>

        {/* Lock 25 v2a brief #10 mount — consolidated-rate disclosure with
         * expandable breakdown. Mounts below the headline take-home grid
         * (Listed/Pro columns) per the brief. */}
        <CommissionBreakdownDisclosure portal="vndr" />
      </div>

      <p className={s.calcFoot}>{t.rich("foot", { strong: (chunks) => <strong>{chunks}</strong> })}</p>

      <div className={s.ctaWrap}>
        <button
          type="button"
          className={s.ctaPrimary}
          onClick={onSubmit}
          disabled={isPending}
        >
          {isPending ? tCta("submitting") : tCta("button")}
        </button>
        {error && <p className={s.ctaError}>{error}</p>}
        <div className={s.ctaMeta}>
          <span>{tCta("metaNoCard")}</span>
          <span className={s.ctaMetaDot} aria-hidden="true" />
          <span>{tCta("metaQuickProfile")}</span>
          <span className={s.ctaMetaDot} aria-hidden="true" />
          <span>{tCta("metaCancel")}</span>
        </div>
      </div>
    </section>
  );
}
