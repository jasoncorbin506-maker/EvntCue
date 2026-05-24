"use client";

import { useState } from "react";
import s from "../vndr.module.css";

/**
 * Package row with inline Plnr referral % slider + visibility bar. Source
 * mockup: P1_Dashboard.html lines ~131–149 (.pkg + .slider-inline + .vis-bar).
 *
 * V-2a: slider is local state only — change doesn't persist. V-2b wires a
 * server action that updates packages.plnr_referral_pct and recomputes
 * visibility (which is a derived signal of price × referral % × trust score
 * × category demand). Three visibility tiers: low / medium / high → 2/4/6
 * filled segments out of 6.
 */
type Visibility = "low" | "medium" | "high";

type Props = {
  name: string;
  desc: string;
  price: string;
  unit: string;
  referralPct: number;
  visibility: Visibility;
};

const VIS_FILL: Record<Visibility, number> = { low: 2, medium: 4, high: 6 };
const VIS_LBL: Record<Visibility, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function PackageRow({ name, desc, price, unit, referralPct, visibility }: Props) {
  const [pct, setPct] = useState(referralPct);
  const filled = VIS_FILL[visibility];

  return (
    <article className={s.pkg}>
      <div className={s.pkgRow}>
        <div>
          <div className={s.pkgName}>{name}</div>
          <div className={s.pkgDesc}>{desc}</div>
        </div>
        <div>
          <div className={s.pkgPrice}>{price}</div>
          <div className={s.pkgSub}>{unit}</div>
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
            onChange={(e) => setPct(Number(e.target.value))}
            className={s.silRange}
            aria-label={`${name} planner referral percentage`}
          />
          <span className={s.silVal}>{pct}%</span>
        </div>
        <div className={s.visBar} aria-label={`${name} visibility: ${VIS_LBL[visibility]}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`${s.vbSeg} ${i < filled ? s.vbSegOn : ""}`.trim()}
            />
          ))}
          <span className={s.vbLbl}>{VIS_LBL[visibility]}</span>
        </div>
      </div>
    </article>
  );
}
