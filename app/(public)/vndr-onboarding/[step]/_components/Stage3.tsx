"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveStage3Action } from "../_actions/save-stage-3";
import sShell from "../vndr-onboarding-stage.module.css";
import s from "./Stage3.module.css";

/**
 * Stage 3 — Capacity & pricing.
 *
 * Source: 02_Locked_Prototypes/Vndr/evntcue_vndr_freemium_v1.html lines
 * 1060-1192. Three sliders + two toggle pairs.
 *
 * Starting-price slider uses a log-scale mapping (slider value 0-100 →
 * dollar amount $500-$25K) so the slider feels even across the range.
 * Math is inlined here (single use); a future shared helper at
 * lib/vndr/log-scale.ts can extract it if Stage 4 or V-2 also needs it.
 *
 * Bench captions are stub static copy for v1 — real DFW percentile data
 * lands Phase 5+ alongside the recommendations engine. Captions speak in
 * "most vendors at your scale" language so they read sensibly without
 * actual per-category numbers behind them.
 */

// Log-scale slider math — 0..100 → ~$500..$25,000.
// f(0) ≈ $500; f(100) ≈ $25,000; smooth across the range.
function priceFromSlider(sliderValue: number): number {
  const minLog = Math.log(500);
  const maxLog = Math.log(25_000);
  const v = Math.max(0, Math.min(100, sliderValue)) / 100;
  const dollars = Math.exp(minLog + (maxLog - minLog) * v);
  // Snap to nearest $50 for clean display.
  return Math.round(dollars / 50) * 50;
}

function sliderFromPriceCents(cents: number | null): number {
  if (cents == null || cents <= 0) return 40; // default mockup value
  const dollars = cents / 100;
  if (dollars <= 500) return 0;
  if (dollars >= 25_000) return 100;
  const minLog = Math.log(500);
  const maxLog = Math.log(25_000);
  const v = (Math.log(dollars) - minLog) / (maxLog - minLog);
  return Math.round(v * 100);
}

function fmtPrice(dollars: number): string {
  if (dollars >= 10_000) return `$${(dollars / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${dollars.toLocaleString("en-US")}`;
}

export function Stage3({
  initial,
}: {
  initial: {
    startingPriceCents: number | null;
    concurrentMax: number | null;
    pricingModel: string | null;
    bookingMode: string | null;
    referralRatePct: number | null;
  };
}) {
  const router = useRouter();
  const t = useTranslations("vndr.onboarding.stages.s3");
  const tShell = useTranslations("vndr.onboarding.stages.shell");

  const [priceSlider, setPriceSlider] = useState(
    sliderFromPriceCents(initial.startingPriceCents),
  );
  const [concurrent, setConcurrent] = useState(initial.concurrentMax ?? 1);
  const [pricingModel, setPricingModel] = useState<"package" | "hourly">(
    initial.pricingModel === "hourly" ? "hourly" : "package",
  );
  const [bookingMode, setBookingMode] = useState<"instant_book" | "inquiry_first">(
    initial.bookingMode === "instant_book" ? "instant_book" : "inquiry_first",
  );
  const [referral, setReferral] = useState(initial.referralRatePct ?? 10);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const priceDollars = priceFromSlider(priceSlider);
  const priceCents = priceDollars * 100;

  const handleContinue = () => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await saveStage3Action({
        startingPriceCents: priceCents,
        concurrentMax: concurrent,
        pricingModel,
        bookingMode,
        referralRatePct: referral,
      });
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      router.push("/vndr-onboarding/4");
    });
  };

  return (
    <>
      <div className={sShell.captureHead}>
        <div className={sShell.capStepMark}>
          <span>Step 3</span>
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

      {/* Starting price slider */}
      <div className={s.sliderBlock}>
        <div className={s.sliderLabelRow}>
          <div className={s.sliderLabelLeft}>
            <span className={s.fLbl}>{t("priceLabel")}</span>
            <div className={s.fHelp}>{t("priceHelp")}</div>
          </div>
          <div className={s.sliderValWrap}>
            <span className={s.sliderVal}>{fmtPrice(priceDollars)}</span>
            <div className={s.sliderValSub}>{t("priceStartingAt")}</div>
          </div>
        </div>
        <div className={s.sliderTrackWrap}>
          <input
            type="range"
            className={s.fSlider}
            min={0}
            max={100}
            step={1}
            value={priceSlider}
            onChange={(e) => setPriceSlider(parseInt(e.target.value, 10))}
            style={{ "--track-pct": `${priceSlider}%` } as React.CSSProperties}
            aria-label={t("priceLabel")}
          />
          <div className={s.sliderTicks}>
            <span>$500</span>
            <span>$2K</span>
            <span>$8K</span>
            <span>$20K+</span>
          </div>
        </div>
        <div className={s.sliderBench}>
          {t.rich("priceBenchmark", {
            price: fmtPrice(priceDollars),
            em: (chunks) => <em>{chunks}</em>,
          })}
        </div>
      </div>

      {/* Concurrent events slider */}
      <div className={s.sliderBlock}>
        <div className={s.sliderLabelRow}>
          <div className={s.sliderLabelLeft}>
            <span className={s.fLbl}>{t("capacityLabel")}</span>
            <div className={s.fHelp}>{t("capacityHelp")}</div>
          </div>
          <div className={s.sliderValWrap}>
            <span className={s.sliderVal}>{concurrent}</span>
            <div className={s.sliderValSub}>{t("capacityAtOneTime")}</div>
          </div>
        </div>
        <div className={s.sliderTrackWrap}>
          <input
            type="range"
            className={s.fSlider}
            min={1}
            max={6}
            step={1}
            value={concurrent}
            onChange={(e) => setConcurrent(parseInt(e.target.value, 10))}
            style={{
              "--track-pct": `${((concurrent - 1) / 5) * 100}%`,
            } as React.CSSProperties}
            aria-label={t("capacityLabel")}
          />
          <div className={s.sliderTicks}>
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6+</span>
          </div>
        </div>
        <div className={s.sliderBench}>
          {t.rich("capacityBenchmark", { em: (chunks) => <em>{chunks}</em> })}
        </div>
      </div>

      {/* Pricing model toggle */}
      <div className={s.formRow}>
        <label className={s.fLbl}>{t("pricingModelLabel")}</label>
        <div className={s.togglePair}>
          <button
            type="button"
            className={`${s.toggleCard} ${pricingModel === "package" ? s.toggleCardOn : ""}`}
            onClick={() => setPricingModel("package")}
            aria-pressed={pricingModel === "package"}
          >
            <div className={s.togT}>{t("pricingModelPackageTitle")}</div>
            <div className={s.togD}>{t("pricingModelPackageDesc")}</div>
          </button>
          <button
            type="button"
            className={`${s.toggleCard} ${pricingModel === "hourly" ? s.toggleCardOn : ""}`}
            onClick={() => setPricingModel("hourly")}
            aria-pressed={pricingModel === "hourly"}
          >
            <div className={s.togT}>{t("pricingModelHourlyTitle")}</div>
            <div className={s.togD}>{t("pricingModelHourlyDesc")}</div>
          </button>
        </div>
      </div>

      {/* Booking flow toggle */}
      <div className={s.formRow}>
        <label className={s.fLbl}>{t("bookingFlowLabel")}</label>
        <div className={s.togglePair}>
          <button
            type="button"
            className={`${s.toggleCard} ${bookingMode === "instant_book" ? s.toggleCardOn : ""}`}
            onClick={() => setBookingMode("instant_book")}
            aria-pressed={bookingMode === "instant_book"}
          >
            <div className={s.togT}>{t("bookingFlowInstantTitle")}</div>
            <div className={s.togD}>{t("bookingFlowInstantDesc")}</div>
          </button>
          <button
            type="button"
            className={`${s.toggleCard} ${bookingMode === "inquiry_first" ? s.toggleCardOn : ""}`}
            onClick={() => setBookingMode("inquiry_first")}
            aria-pressed={bookingMode === "inquiry_first"}
          >
            <div className={s.togT}>{t("bookingFlowInquiryTitle")}</div>
            <div className={s.togD}>{t("bookingFlowInquiryDesc")}</div>
          </button>
        </div>
      </div>

      {/* Referral rate slider */}
      <div className={`${s.sliderBlock} ${s.referralSection}`}>
        <div className={s.sliderLabelRow}>
          <div className={s.sliderLabelLeft}>
            <span className={s.fLbl}>{t("referralLabel")}</span>
            <div className={s.fHelp}>{t("referralHelp")}</div>
          </div>
          <div className={s.sliderValWrap}>
            <span className={s.sliderVal}>
              {referral}
              <span className={s.sliderValPct}>%</span>
            </span>
            <div className={s.sliderValSub}>{t("referralOfBooking")}</div>
          </div>
        </div>
        <div className={s.sliderTrackWrap}>
          <input
            type="range"
            className={s.fSlider}
            min={0}
            max={20}
            step={1}
            value={referral}
            onChange={(e) => setReferral(parseInt(e.target.value, 10))}
            style={{ "--track-pct": `${(referral / 20) * 100}%` } as React.CSSProperties}
            aria-label={t("referralLabel")}
          />
          <div className={s.sliderTicks}>
            <span>0%</span>
            <span>5%</span>
            <span>10%</span>
            <span>15%</span>
            <span>20%</span>
          </div>
        </div>
        <div className={s.sliderBench}>
          {t.rich("referralBenchmark", {
            rate: referral.toString(),
            em: (chunks) => <em>{chunks}</em>,
          })}
        </div>
      </div>

      {error && (
        <div className={s.errorBanner} role="alert">
          {error}
        </div>
      )}

      <div className={sShell.capNav}>
        <span className={sShell.capMeta}>{t("metaSavedOnContinue")}</span>
        <button
          type="button"
          className={`${sShell.btnPrimary} ${pending ? sShell.btnPrimaryDisabled : ""}`}
          onClick={handleContinue}
          disabled={pending}
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
