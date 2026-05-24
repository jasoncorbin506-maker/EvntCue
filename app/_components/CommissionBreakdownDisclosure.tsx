"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  COMMISSION_RATES,
  type PortalKey,
  type TierKey,
} from "@/data/commission-rates";
import s from "./CommissionBreakdownDisclosure.module.css";

type Props = {
  /** Which portal's rates to surface. */
  portal: PortalKey;
  /** Which tiers to compare in the disclosure body. Defaults to ['free', 'pro']
   *  — the common Stage-0 case. Enterprise renders a CTA-only row (no expand). */
  tiers?: readonly TierKey[];
};

/**
 * Commission rate disclosure — Lock 25 v2a brief #10 ship.
 *
 * Surfaces the headline consolidated rate (single number, processing included)
 * for each tier passed in, with an expandable "What's in the fee?" disclosure
 * that reveals the internal breakdown (stripe + evntcue + marketplace if
 * applicable).
 *
 * Enterprise tiers (commissionRate=null) render "Contact us" + no expand —
 * sales-led pricing isn't broken down.
 *
 * i18n keys live under `pricing.commissionBreakdown.*` per Lock 25 v2a brief.
 *
 * Mount example (Stage 0 calculator):
 *   <CommissionBreakdownDisclosure portal="vndr" tiers={['free', 'pro']} />
 */
export function CommissionBreakdownDisclosure({
  portal,
  tiers = ["free", "pro"] as const,
}: Props) {
  const t = useTranslations("pricing.commissionBreakdown");
  const [expanded, setExpanded] = useState(false);

  return (
    <section className={s.wrap} aria-label="Commission breakdown">
      <div className={s.headlines}>
        {tiers.map((tier) => {
          const config = COMMISSION_RATES[portal][tier];
          const isEnterprise = config.commissionRate === null;
          const tierLabel = formatTierLabel(tier);
          return (
            <div key={tier} className={s.headlineRow}>
              <div className={s.tierLabel}>{tierLabel}</div>
              <div className={s.headlineRate}>
                {isEnterprise
                  ? t("noBreakdown")
                  : t("headlineTotal", { rate: config.displayLabel })}
              </div>
              {!isEnterprise && (
                <div className={s.headlineIncludes}>{t("headlineIncludes")}</div>
              )}
            </div>
          );
        })}
      </div>

      {tiers.some((t) => COMMISSION_RATES[portal][t].commissionRate !== null) && (
        <button
          type="button"
          className={s.disclosureToggle}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className={s.disclosureChevron} aria-hidden="true">
            {expanded ? "▾" : "▸"}
          </span>
          {t("disclosureLabel")}
        </button>
      )}

      {expanded && (
        <div className={s.breakdownGrid}>
          {tiers.map((tier) => {
            const config = COMMISSION_RATES[portal][tier];
            if (config.internalBreakdown === null) return null;
            const breakdown = config.internalBreakdown;
            const vendorKeeps =
              config.commissionRate === null ? null : 1 - config.commissionRate;
            return (
              <div key={tier} className={s.breakdownCol}>
                <div className={s.breakdownTierLabel}>{formatTierLabel(tier)}</div>
                <BreakdownRow
                  label={t("stripeProcessing")}
                  value={formatPct(breakdown.stripeProcessing)}
                />
                <BreakdownRow
                  label={t("evntcuePlatform")}
                  value={formatPct(breakdown.evntcuePlatform)}
                />
                {breakdown.marketplaceCommission > 0 && (
                  <BreakdownRow
                    label={t("marketplaceCommission")}
                    value={formatPct(breakdown.marketplaceCommission)}
                  />
                )}
                <BreakdownRow
                  label={t("vendorKeeps")}
                  value={vendorKeeps !== null ? formatPct(vendorKeeps) : "—"}
                  emphasis
                />
              </div>
            );
          })}
        </div>
      )}

      {expanded && (
        <div className={s.proCallout}>{proCalloutKey(portal, t)}</div>
      )}
    </section>
  );
}

function BreakdownRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`${s.breakdownRow} ${emphasis ? s.breakdownRowEmphasis : ""}`}>
      <span className={s.breakdownRowLabel}>{label}</span>
      <span className={s.breakdownRowValue}>{value}</span>
    </div>
  );
}

function formatTierLabel(tier: TierKey): string {
  if (tier === "free") return "Free";
  if (tier === "pro") return "Pro";
  return "Enterprise";
}

function formatPct(value: number): string {
  // Display whole percent when clean (5% not 5.0%); one decimal otherwise.
  const pct = value * 100;
  if (Math.round(pct) === pct) return `${pct}%`;
  return `${pct.toFixed(1)}%`;
}

function proCalloutKey(
  portal: PortalKey,
  t: (key: string) => string,
): string {
  // Plnr + Venu share a callout (11% → 5% framing); Vndr + Catr share another
  // (Pro removes caps + unlocks tools). Orgnz has no commission so no callout.
  if (portal === "plnr" || portal === "venu") return t("proCalloutPlnrVenu");
  if (portal === "vndr" || portal === "catr") return t("proCalloutVndrCatr");
  return "";
}
