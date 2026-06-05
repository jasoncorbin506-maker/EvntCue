"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { BackLink } from "@/lib/ui/BackLink";
import { VNDR_CATEGORIES, isVndrCategoryKey } from "@/data/vndr-categories";
import { vendorCategoryLabel } from "@/lib/labels/vendor-categories";
import { CATEGORY_ICONS } from "@/app/(public)/vndr-onboarding/[step]/_components/category-icons";
import type { Locale } from "@/i18n/locale";
import type {
  VendorListing,
  VenueListing,
  CatrListing,
  PlannerListing,
} from "@/lib/marketplace/listings";
import type { InquiryEventOption } from "@/lib/orgnz/active-events";
import {
  SendInquirySheet,
  type InquiryTarget,
} from "../../_components/SendInquirySheet";
import {
  InvitePlannerSheet,
  type InvitePlannerTarget,
} from "../../_components/InvitePlannerSheet";
import {
  SellerProfileSheet,
  type SellerProfile,
} from "../../_components/SellerProfileSheet";
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

function VendorCard({
  v,
  onView,
  onInquire,
}: {
  v: VendorListing;
  onView: () => void;
  onInquire: () => void;
}) {
  const cheapest = v.packages.reduce<number | null>((min, p) => {
    if (p.priceCents == null) return min;
    return min == null || p.priceCents < min ? p.priceCents : min;
  }, null);
  const fromCents = v.startingPriceCents ?? cheapest;
  const cover = v.photos[0];
  return (
    <div className={s.listingCard}>
      <button
        type="button"
        className={s.cardOpen}
        onClick={onView}
        aria-label={`View ${v.displayName}`}
      >
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
      </button>
      <div className={s.cardActions}>
        <button type="button" className={s.inquirePill} onClick={onInquire}>
          Inquire →
        </button>
      </div>
    </div>
  );
}

function VenueCard({
  v,
  onView,
  onInquire,
}: {
  v: VenueListing;
  onView: () => void;
  onInquire: () => void;
}) {
  const topSpace = v.spaces[0];
  const rate = topSpace ? dollars(topSpace.ratePerDayCents) : null;
  const cap = v.spaces.reduce<number | null>((max, sp) => {
    if (sp.capacity == null) return max;
    return max == null || sp.capacity > max ? sp.capacity : max;
  }, null);
  return (
    <div className={s.listingCard}>
      <button
        type="button"
        className={s.cardOpen}
        onClick={onView}
        aria-label={`View ${v.displayName}`}
      >
        <div className={s.listingPhoto}>
          {v.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.photos[0].url} alt={v.photos[0].alt ?? v.displayName} loading="lazy" />
          ) : (
            <div className={s.listingPhotoEmpty} aria-hidden="true" />
          )}
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
      <div className={s.cardActions}>
        <button type="button" className={s.inquirePill} onClick={onInquire}>
          Inquire →
        </button>
      </div>
    </div>
  );
}

function CatrCard({
  v,
  onView,
  onInquire,
}: {
  v: CatrListing;
  onView: () => void;
  onInquire: () => void;
}) {
  const cheapest = v.tiers.reduce<number | null>((min, t) => {
    if (t.perGuestCents == null) return min;
    return min == null || t.perGuestCents < min ? t.perGuestCents : min;
  }, null);
  return (
    <div className={s.listingCard}>
      <button
        type="button"
        className={s.cardOpen}
        onClick={onView}
        aria-label={`View ${v.displayName}`}
      >
        <div className={s.listingPhoto}>
          {v.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.photos[0].url} alt={v.photos[0].alt ?? v.displayName} loading="lazy" />
          ) : (
            <div className={s.listingPhotoEmpty} aria-hidden="true" />
          )}
        </div>
        <div className={s.listingBody}>
          <div className={s.listingName}>{v.displayName}</div>
          <div className={s.listingMeta}>
            {[v.city, ...v.cuisineTypes].filter(Boolean).join(" · ")}
          </div>
          {cheapest != null && (
            <div className={s.listingPrice}>
              From <strong>{dollars(cheapest)}</strong> / guest
            </div>
          )}
        </div>
      </button>
      <div className={s.cardActions}>
        <button type="button" className={s.inquirePill} onClick={onInquire}>
          Inquire →
        </button>
      </div>
    </div>
  );
}

const PLNR_LEVEL_LABELS: Record<string, string> = {
  "full-service": "Full-service",
  partial: "Partial",
  "day-of": "Day-of",
};

function PlnrCard({
  v,
  onView,
  onInvite,
}: {
  v: PlannerListing;
  onView: () => void;
  onInvite: () => void;
}) {
  const meta = [
    v.city,
    ...v.serviceLevels.map((l) => PLNR_LEVEL_LABELS[l] ?? l),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className={s.listingCard}>
      <button
        type="button"
        className={s.cardOpen}
        onClick={onView}
        aria-label={`View ${v.displayName}`}
      >
        <div className={s.listingPhoto}>
          {v.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.photos[0].url} alt={v.photos[0].alt ?? v.displayName} loading="lazy" />
          ) : (
            <div className={s.listingPhotoEmpty} aria-hidden="true" />
          )}
        </div>
        <div className={s.listingBody}>
          <div className={s.listingName}>{v.displayName}</div>
          <div className={s.listingMeta}>{meta}</div>
        </div>
      </button>
      <div className={s.cardActions}>
        <button type="button" className={s.inquirePill} onClick={onInvite}>
          Invite as planner →
        </button>
      </div>
    </div>
  );
}

export function BrowseClient({
  vendors,
  venues,
  caterers,
  planners,
  activeEvents,
  invitedTenantIds,
  initialFocus,
  selectedEventId,
}: {
  vendors: VendorListing[];
  venues: VenueListing[];
  caterers: CatrListing[];
  planners: PlannerListing[];
  activeEvents: InquiryEventOption[];
  invitedTenantIds: string[];
  initialFocus: string | null;
  /** The Chrome's currently-selected event (PL #61) — defaults the composers. */
  selectedEventId: string | null;
}) {
  const locale = useLocale() as Locale;
  const [selected, setSelected] = useState<string | null>(initialFocus);
  const [inquiryTarget, setInquiryTarget] = useState<InquiryTarget | null>(null);
  const [invitePlannerTarget, setInvitePlannerTarget] =
    useState<InvitePlannerTarget | null>(null);
  const [profileTarget, setProfileTarget] = useState<SellerProfile | null>(null);

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
  // Catr is held OUT of the buyer-facing marketplace for now (Jason 2026-06-01).
  // The catr back-office (profile + menu tiers) is live so caterers can build
  // their listing, but organizers don't see catr listings until this flips on.
  // Plnr is likewise placeholder. Flip CATR_MARKETPLACE_LIVE → true to launch.
  const CATR_MARKETPLACE_LIVE = false;
  const showCaterers = active?.key === "catr" && CATR_MARKETPLACE_LIVE;
  // Plnr is likewise held OUT of the buyer-facing marketplace for now (Lock 30
  // Phase C pt 2 ships dormant). The plnr back-office (profile + photos) and the
  // buyer→planner invite primitive are live, but organizers don't see planner
  // listings until this flips on. Flip PLNR_MARKETPLACE_LIVE → true to launch.
  const PLNR_MARKETPLACE_LIVE = false;
  const showPlanners = active?.key === "plnr" && PLNR_MARKETPLACE_LIVE;
  const showPlaceholder =
    active != null &&
    !isVndrCategoryKey(active.key) &&
    !showVenues &&
    !showCaterers &&
    !showPlanners;

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

      {active &&
        (isVndrCategoryKey(active.key) || showVenues || showCaterers || showPlanners) && (
        <div
          className={s.listings}
          style={{ "--tile-accent": active.accent, "--tile-tint": active.tint } as React.CSSProperties}
        >
          <div className={s.listingsHead}>
            <span className={s.listingsTitle}>{active.name}</span>
            <span className={s.listingsCount}>
              {showVenues
                ? venues.length
                : showCaterers
                  ? caterers.length
                  : showPlanners
                    ? planners.length
                    : activeVendors.length}
            </span>
          </div>

          {showPlanners ? (
            planners.length > 0 ? (
              <div className={s.listingGrid}>
                {planners.map((v) => (
                  <PlnrCard
                    key={v.tenantId}
                    v={v}
                    onView={() => setProfileTarget({ kind: "plnr", planner: v })}
                    onInvite={() =>
                      setInvitePlannerTarget({
                        tenantId: v.tenantId,
                        displayName: v.displayName,
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
          ) : showCaterers ? (
            caterers.length > 0 ? (
              <div className={s.listingGrid}>
                {caterers.map((v) => (
                  <CatrCard
                    key={v.tenantId}
                    v={v}
                    onView={() => setProfileTarget({ kind: "catr", caterer: v })}
                    onInquire={() =>
                      setInquiryTarget({
                        tenantId: v.tenantId,
                        displayName: v.displayName,
                        portal: "catr",
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
          ) : showVenues ? (
            venues.length > 0 ? (
              <div className={s.listingGrid}>
                {venues.map((v) => (
                  <VenueCard
                    key={v.tenantId}
                    v={v}
                    onView={() => setProfileTarget({ kind: "venu", venue: v })}
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
                <VendorCard
                  key={v.tenantId}
                  v={v}
                  onView={() => setProfileTarget({ kind: "vndr", vendor: v })}
                  onInquire={() =>
                    setInquiryTarget({
                      tenantId: v.tenantId,
                      displayName: v.displayName,
                      portal: "vndr",
                    })
                  }
                />
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

      {profileTarget && (
        <SellerProfileSheet
          profile={profileTarget}
          initiallyInvited={invitedTenantIds.includes(
            profileTarget.kind === "vndr"
              ? profileTarget.vendor.tenantId
              : profileTarget.kind === "venu"
                ? profileTarget.venue.tenantId
                : profileTarget.kind === "catr"
                  ? profileTarget.caterer.tenantId
                  : profileTarget.planner.tenantId,
          )}
          onClose={() => setProfileTarget(null)}
          onInquire={() => {
            // Planners engage via invite (Lock 28 holds plnr out of the inquiry
            // path) — the profile sheet's primary CTA opens InvitePlannerSheet
            // for plnr, SendInquirySheet for everyone else.
            if (profileTarget.kind === "plnr") {
              const p = profileTarget.planner;
              setProfileTarget(null);
              setInvitePlannerTarget({
                tenantId: p.tenantId,
                displayName: p.displayName,
              });
              return;
            }
            const t =
              profileTarget.kind === "vndr"
                ? profileTarget.vendor
                : profileTarget.kind === "venu"
                  ? profileTarget.venue
                  : profileTarget.caterer;
            setProfileTarget(null);
            setInquiryTarget({
              tenantId: t.tenantId,
              displayName: t.displayName,
              portal: profileTarget.kind,
            });
          }}
        />
      )}

      {inquiryTarget && (
        <SendInquirySheet
          target={inquiryTarget}
          events={activeEvents}
          defaultEventId={selectedEventId}
          onClose={() => setInquiryTarget(null)}
        />
      )}

      {invitePlannerTarget && (
        <InvitePlannerSheet
          target={invitePlannerTarget}
          events={activeEvents}
          defaultEventId={selectedEventId}
          onClose={() => setInvitePlannerTarget(null)}
        />
      )}
    </div>
  );
}
