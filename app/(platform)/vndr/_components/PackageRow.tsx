"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updatePackageFields } from "../_actions/upsert-package";
import { visibilityTier, type VndrPackage } from "@/lib/vndr/packages-shared";
import s from "../vndr.module.css";

/**
 * V-2b: Package row wired to public.vndr_packages (legacy survivor
 * post-2026-05-25 consolidation, migration 054). Slider persists referral_pct
 * via updatePackageFields server action (debounced 400ms so dragging
 * doesn't flood the wire). Visibility toggle wraps the whole row; the
 * derived tier (low/medium/high) re-renders from referral_pct + isVisible.
 *
 * V-2a's hardcoded VIS_FILL/VIS_LBL maps carry over — they're per-tier
 * derived display state, not stored.
 */

type Visibility = "low" | "medium" | "high";

const VIS_FILL: Record<Visibility, number> = { low: 2, medium: 4, high: 6 };
const VIS_LBL: Record<Visibility, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const DEBOUNCE_MS = 400;

type Props = {
  pkg: VndrPackage;
  /**
   * Optional — when provided, the row renders an "Edit" affordance that
   * opens the EditPackageSheet on the parent. V-2b smoke-fix session 23
   * (brief G4) introduced this; the inline slider + visibility toggle
   * still persist via updatePackageFields independently.
   */
  onEdit?: () => void;
};

export function PackageRow({ pkg, onEdit }: Props) {
  const [pct, setPct] = useState(pkg.referralPct);
  const [isVisible, setIsVisible] = useState(pkg.isVisible);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function handleSliderChange(next: number) {
    setPct(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startTransition(async () => {
        await updatePackageFields({ id: pkg.id, referralPct: next });
      });
    }, DEBOUNCE_MS);
  }

  function handleVisibilityToggle() {
    const next = !isVisible;
    setIsVisible(next);
    startTransition(async () => {
      await updatePackageFields({ id: pkg.id, isVisible: next });
    });
  }

  const tier = visibilityTier({ ...pkg, referralPct: pct, isVisible });
  const filled = VIS_FILL[tier];
  const priceFmt = formatPrice(pkg.priceCents);

  return (
    <article className={s.pkg}>
      <div className={s.pkgRow}>
        <div>
          <div className={s.pkgName}>{pkg.name}</div>
          <div className={s.pkgDesc}>
            {pkg.description ?? (pkg.addons.length > 0
              ? `${pkg.addons.length} add-on${pkg.addons.length === 1 ? "" : "s"}`
              : "")}
          </div>
        </div>
        <div className={s.pkgRight}>
          <div className={s.pkgPrice}>{priceFmt}</div>
          <div className={s.pkgSub}>flat</div>
          {onEdit && (
            <button
              type="button"
              className={s.pkgEditBtn}
              onClick={onEdit}
              aria-label={`Edit ${pkg.name}`}
            >
              Edit
            </button>
          )}
        </div>
      </div>
      <div className={s.pkgFooter}>
        <div className={s.sliderInline}>
          <span className={s.silLbl}>Plnr ref</span>
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={pct}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className={s.silRange}
            aria-label={`${pkg.name} planner referral percentage`}
          />
          <span className={s.silVal}>{pct}%</span>
        </div>
        <button
          type="button"
          className={s.visBar}
          onClick={handleVisibilityToggle}
          aria-label={`${pkg.name} visibility: ${VIS_LBL[tier]} (tap to ${
            isVisible ? "hide" : "show"
          })`}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`${s.vbSeg} ${i < filled ? s.vbSegOn : ""}`.trim()}
            />
          ))}
          <span className={s.vbLbl}>
            {isVisible ? VIS_LBL[tier] : "Hidden"}
          </span>
        </button>
      </div>
    </article>
  );
}

function formatPrice(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}
