"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { VNDR_CATEGORIES, type VndrCategoryKey } from "@/data/vndr-categories";
import { vendorCategoryLabel } from "@/lib/labels/vendor-categories";
import { CATEGORY_ICONS } from "@/app/(public)/vndr-onboarding/[step]/_components/category-icons";
import type { Locale } from "@/i18n/locale";
import s from "./browse.module.css";

/**
 * Orgnz marketplace browse — "what are you shopping for?" tile grid.
 *
 * Mirrors the Vndr intake funnel's category screen (Stage1): a grid of tiles,
 * each naming a provider type the shopper can pursue. Vendor categories reuse
 * the Vndr taxonomy + icons (coral); Venu/Plnr/Catr are added as their own
 * provider types in their portal colors.
 *
 * Listings/discovery land with V-2d. Until then, tapping a tile reveals an
 * honest forward-looking placeholder rather than a dead-end (Lock 22) — this
 * replaces the stale "marketplace opens in Phase 5" toast the drill sheets fired.
 */

const CORAL = { accent: "var(--coral)", tint: "rgba(232, 98, 42, 0.07)" };

// Friendly nouns for the placeholder copy (the grouped category labels read
// stiffly in a sentence — "verified Photography & Media" — so each tile carries
// a shopper-facing noun).
const VNDR_NOUNS: Record<VndrCategoryKey, string> = {
  photo: "photographers & media teams",
  florals: "florists & designers",
  audio: "DJs, bands & musicians",
  visual: "AV & lighting pros",
  rentals: "rental companies",
  beauty: "hair & makeup artists",
  entertain: "entertainment",
  transport: "transportation",
};

const PORTAL_ICONS = {
  venu: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 14V7l6-3.5L14 7v7M2 14h12M6 14v-3.5h4V14" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  plnr: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3.5" y="2.5" width="9" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 2v2h4V2M6 7h4M6 10h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  catr: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 9a5 5 0 0110 0H3zM2 11h12M8 4V2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

type Tile = {
  key: string;
  name: string;
  examples: string;
  noun: string;
  accent: string;
  tint: string;
  icon: React.ReactNode;
};

export default function OrgnzBrowse() {
  const locale = useLocale() as Locale;
  // Deep-link focus (e.g. /orgnz/browse?focus=plnr from the Plnr tile) pre-selects
  // a provider tile so its "coming soon" placeholder shows on load.
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string | null>(searchParams.get("focus"));

  const vendorTiles: Tile[] = VNDR_CATEGORIES.map((cat) => ({
    key: cat.key,
    name: vendorCategoryLabel(cat.key, locale),
    examples: cat.subTypes.slice(0, 3).join(" · "),
    noun: VNDR_NOUNS[cat.key],
    accent: CORAL.accent,
    tint: CORAL.tint,
    icon: CATEGORY_ICONS[cat.key],
  }));

  const portalTiles: Tile[] = [
    {
      key: "venu",
      name: "Venues",
      examples: "Ballrooms · gardens · estates",
      noun: "venues",
      accent: "var(--blue)",
      tint: "rgba(42, 107, 219, 0.07)",
      icon: PORTAL_ICONS.venu,
    },
    {
      key: "plnr",
      name: "Planners",
      examples: "Full-service · partial · day-of",
      noun: "planners",
      accent: "var(--violet)",
      tint: "rgba(139, 95, 184, 0.08)",
      icon: PORTAL_ICONS.plnr,
    },
    {
      key: "catr",
      name: "Catering",
      examples: "Plated · buffet · stations · bar",
      noun: "caterers",
      accent: "var(--amber)",
      tint: "rgba(201, 138, 26, 0.08)",
      icon: PORTAL_ICONS.catr,
    },
  ];

  const tiles: Tile[] = [...vendorTiles, ...portalTiles];
  const active = tiles.find((tile) => tile.key === selected) ?? null;

  return (
    <div className={s.wrap}>
      <Link href="/orgnz" className={s.back}>
        ‹ Dashboard
      </Link>

      <div className={s.head}>
        <div className={s.eyebrow}>Marketplace</div>
        <h1 className={s.title}>
          Find your <em>team</em>
        </h1>
        <p className={s.sub}>
          Browse DFW&apos;s verified vendors, venues, planners, and caterers — all in one place.
        </p>
      </div>

      <div className={s.grid}>
        {tiles.map((tile) => {
          const on = selected === tile.key;
          return (
            <button
              key={tile.key}
              type="button"
              className={`${s.card} ${on ? s.cardOn : ""}`}
              style={{ "--tile-accent": tile.accent, "--tile-tint": tile.tint } as React.CSSProperties}
              onClick={() => setSelected(on ? null : tile.key)}
              aria-pressed={on}
            >
              <div className={s.ico}>{tile.icon}</div>
              <div className={s.name}>{tile.name}</div>
              <div className={s.examples}>{tile.examples}</div>
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className={s.placeholder}
          style={{ "--tile-accent": active.accent, "--tile-tint": active.tint } as React.CSSProperties}
        >
          <div className={s.phEye}>{active.name}</div>
          <div className={s.phTitle}>Coming soon.</div>
          <p className={s.phBody}>
            We&apos;re curating DFW&apos;s verified {active.noun}. Soon you&apos;ll browse, compare,
            and message them right here. For now, your booked team appears on your dashboard as
            you lock them in.
          </p>
        </div>
      )}
    </div>
  );
}
