"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { BackLink } from "@/lib/ui/BackLink";
import { VNDR_CATEGORIES, isVndrCategoryKey } from "@/data/vndr-categories";
import { vendorCategoryLabel } from "@/lib/labels/vendor-categories";
import { CATEGORY_ICONS } from "@/app/(public)/vndr-onboarding/[step]/_components/category-icons";
import type { Locale } from "@/i18n/locale";
import type { VendorListing, VenueListing } from "@/lib/marketplace/listings";
import type { InquiryEventOption } from "@/lib/orgnz/active-events";
import {
  SendInquirySheet,
  type InquiryTarget,
} from "../../_components/SendInquirySheet";
import s from "../browse.module.css";

/**
 * Orgnz marketplace browse — "what are you shopping for?" tile grid + the
 * published listings for the selected tile (V-2d). Vendor categories reuse the
 * Vndr taxonomy + icons (coral); Venu/Plnr/Catr are their own provider types
 * in their portal colors.
 *
 * Data comes from the published-only marketplace views (migration 078) via the
 * server page. Vndr categories and Venu render real cards; Plnr/Catr have no
 * listing surface yet (no profile table) so they keep the forward-looking
 * placeholder. Cue (Phase 3.4) later narrows/ranks this same grid.
 */

const CORAL = { accent: "var(--coral)", tint: "rgba(232, 98, 42, 0.07)" };

const VNDR_NOUNS: Record<string, string> = {
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

function dollars(cents: number | null): string | null {
  if (cents == null) return null;
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function VendorCard({ v }: { v: VendorListing }) {
  const cheapest = v.packages.reduce<number | null>((min, p) => {
    if (p.priceCents == null) return min;
    return min == null || p.priceCents < min ? p.priceCents : min;
  }, null);
  const fromCents = v.startingPriceCents ?? cheapest;
  const cover = v.photos[0];
  return (
    <div className={s.listingCard}>
      <div className={s.listingPhoto}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt={cover.alt ?? v.displayName} loading="lazy" />
        ) : (
          <div className={s.listingPhotoEmpty} aria-hidden="true" />
        )}
      </div>
      <div className={s.listingBody}>
        <div className={s.listingName}>{v.displayName}</div>
        <div className={s.listingMeta}>
          {[v.subType, v.city].filter(Boolean).join(" · ")}
        </div>
        {fromCents != null && (
          <div className={s.listingPrice}>
            From <strong>{dollars(fromCents)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

function VenueCard({ v, onInquire }: { v: VenueListing; onInquire: () => void }) {
  const topSpace = v.spaces[0];
  const rate = topSpace ? dollars(topSpace.ratePerDayCents) : null;
  const cap = v.spaces.reduce<number | null>((max, sp) => {
    if (sp.capacity == null) return max;
    return max == null || sp.capacity > max ? sp.capacity : max;
  }, null);
  return (
    <button
      type="button"
      className={`${s.listingCard} ${s.listingCardBtn}`}
      onClick={onInquire}
      aria-label={`Inquire with ${v.displayName}`}
    >
      <div className={s.listingPhoto}>
        <div className={s.listingPhotoEmpty} aria-hidden="true" />
      </div>
      <div className={s.listingBody}>
        <div className={s.listingName}>{v.displayName}</div>
        <div className={s.listingMeta}>
          {[v.city, v.state].filter(Boolean).join(", ")}
          {cap != null ? ` · up to ${cap.toLocaleString("en-US")} guests` : ""}
        </div>
        {rate != null && (
          <div className={s.listingPrice}>
            From <strong>{rate}</strong> / day
          </div>
        )}
        {(v.coiVerified || v.propertyVerified) && (
          <div className={s.listingBadges}>
            {v.propertyVerified && <span className={s.listingBadge}>Property verified</span>}
            {v.coiVerified && <span className={s.listingBadge}>Insured</span>}
          </div>
        )}
      </div>
    </button>
  );
}

export function BrowseClient({
  vendors,
  venues,
  activeEvents,
  initialFocus,
}: {
  vendors: VendorListing[];
  venues: VenueListing[];
  activeEvents: InquiryEventOption[];
  initialFocus: string | null;
}) {
  const locale = useLocale() as Locale;
  const [selected, setSelected] = useState<string | null>(initialFocus);
  const [inquiryTarget, setInquiryTarget] = useState<InquiryTarget | null>(null);

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
    { key: "venu", name: "Venues", examples: "Ballrooms · gardens · estates", noun: "venues", accent: "var(--blue)", tint: "rgba(42, 107, 219, 0.07)", icon: PORTAL_ICONS.venu },
    { key: "plnr", name: "Planners", examples: "Full-service · partial · day-of", noun: "planners", accent: "var(--violet)", tint: "rgba(139, 95, 184, 0.08)", icon: PORTAL_ICONS.plnr },
    { key: "catr", name: "Catering", examples: "Plated · buffet · stations · bar", noun: "caterers", accent: "var(--amber)", tint: "rgba(201, 138, 26, 0.08)", icon: PORTAL_ICONS.catr },
  ];

  const tiles: Tile[] = [...vendorTiles, ...portalTiles];
  const active = tiles.find((tile) => tile.key === selected) ?? null;

  const activeVendors =
    active && isVndrCategoryKey(active.key)
      ? vendors.filter((v) => v.category === active.key)
      : [];
  const showVenues = active?.key === "venu";
  // Plnr/Catr have no listing surface yet → forward-looking placeholder.
  const showPlaceholder = active != null && !isVndrCategoryKey(active.key) && !showVenues;

  return (
    <div className={s.wrap}>
      {active ? (
        <BackLink onClick={() => setSelected(null)} label="All categories" className={s.back} />
      ) : (
        <BackLink href="/orgnz" label="Dashboard" className={s.back} />
      )}

      {!active && (
        <>
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
            {tiles.map((tile) => (
              <button
                key={tile.key}
                type="button"
                className={s.card}
                style={{ "--tile-accent": tile.accent, "--tile-tint": tile.tint } as React.CSSProperties}
                onClick={() => setSelected(tile.key)}
              >
                <div className={s.ico}>{tile.icon}</div>
                <div className={s.name}>{tile.name}</div>
                <div className={s.examples}>{tile.examples}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {active && (isVndrCategoryKey(active.key) || showVenues) && (
        <div
          className={s.listings}
          style={{ "--tile-accent": active.accent, "--tile-tint": active.tint } as React.CSSProperties}
        >
          <div className={s.listingsHead}>
            <span className={s.listingsTitle}>{active.name}</span>
            <span className={s.listingsCount}>
              {showVenues ? venues.length : activeVendors.length}
            </span>
          </div>

          {showVenues ? (
            venues.length > 0 ? (
              <div className={s.listingGrid}>
                {venues.map((v) => (
                  <VenueCard
                    key={v.tenantId}
                    v={v}
                    onInquire={() =>
                      setInquiryTarget({
                        tenantId: v.tenantId,
                        displayName: v.displayName,
                        portal: "venu",
                      })
                    }
                  />
                ))}
              </div>
            ) : (
              <p className={s.listingEmpty}>
                No published {active.noun} yet — check back soon.
              </p>
            )
          ) : activeVendors.length > 0 ? (
            <div className={s.listingGrid}>
              {activeVendors.map((v) => (
                <VendorCard key={v.tenantId} v={v} />
              ))}
            </div>
          ) : (
            <p className={s.listingEmpty}>
              No published {active.noun} yet — check back soon.
            </p>
          )}
        </div>
      )}

      {showPlaceholder && active && (
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

      {inquiryTarget && (
        <SendInquirySheet
          target={inquiryTarget}
          events={activeEvents}
          onClose={() => setInquiryTarget(null)}
        />
      )}
    </div>
  );
}
