# lib/labels — DB enum → UI display string translation

**Locked 2026-05-13 (Lock 15).** See `00_Live/04_OPERATING_RITUAL.md` section 6 locked decision #15 and `00_Live/02_CLAUDE.md` Hard Rule #7.

## The rule

The database speaks to engineers; the UI speaks to the customer. Never the other way around.

Every enum that surfaces in any UI must route through a labels module here. UI components import display strings from these modules — never the raw enum value, never a hardcoded string that mirrors the enum.

## Canonical example

DB enum `commission_flows.type` includes `venue_kickback`. The word "kickback" is fine in venue-industry shop-talk — everyone in the business knows it means "agreed-upon referral compensation." But to a first-time reader on a marketing surface, it reads as bribery.

So `commission-flows.ts` maps `venue_kickback` → `"referral fee"` for display, and that string is the only thing the UI ever sees.

## Pattern

```ts
// lib/labels/commission-flows.ts
export type CommissionFlowType =
  | "venue_in_house"
  | "venue_fb_surcharge"
  | "venue_kickback"
  | "venue_referral"
  | /* ... */ ;

export const commissionFlowLabel: Record<CommissionFlowType, string> = {
  venue_in_house:     "In-house fee",
  venue_fb_surcharge: "F&B surcharge",
  venue_kickback:     "Referral fee",
  venue_referral:     "Planner sourcing fee",
  /* ... */
};
```

UI imports `commissionFlowLabel[row.type]`, never `row.type` directly.

## When to add a new labels module

- A new enum is added that will surface in UI copy anywhere — landing pages, dashboards, breakdowns, configuration sheets, modals, even debug views (debug views become production views).
- An existing enum gets a UI use it didn't have before. Add the labels module before the UI ships.

## Naming convention

One file per enum domain: `commission-flows.ts`, `event-subtypes.ts`, `inquiry-status.ts`, etc. Match the DB schema's logical grouping, not the table name.

## i18n note

ES coverage was added 2026-05-27 (language-hygiene pass) for the four PL #41-44
maps: `event-subtypes.ts`, `inquiry-status.ts`, `vendor-categories.ts`,
`commission-flows.ts`. Locale-aware label functions accept `Locale` as a
parameter (required for `event-subtypes.ts` and `vendor-categories.ts`;
optional with EN default for `inquiry-status.ts` since Venu portal is back-
of-house EN-only per Phase 5+ phasing). When per-portal Spanish coverage lands
elsewhere, callers thread `locale` through. Back-of-house portals stay EN
until their portal-localization pass.

## Audit queue (Lock 15 — 2026-05-13)

Status as of 2026-05-27 language-hygiene pass:

- ✅ `event-subtypes.ts` — shipped. Wraps `events.event_subtype` (TEXT column
  per migration 021) against the canonical key list in `data/budget-presets.ts`.
  41 subtypes covered EN + ES, DFW-Hispanic register per Lock 14b. PARKING_LOT #41 resolved.
- ✅ `inquiry-status.ts` — shipped + extended. Seven-state lifecycle covered
  EN + ES. "Inked" kept (Jason's 2026-05-17 decision reaffirmed 2026-05-27).
  PARKING_LOT #42 resolved.
- ✅ `vendor-categories.ts` — shipped. `vendorSubTypeCueExpansion()` added
  for Cue-prose expansion of abbreviations (DJ → "DJ or master of ceremonies").
  Category-level ES already in `data/vndr-categories.ts`. PARKING_LOT #43 resolved.
- ✅ `commission-flows.ts` — Lock 15 precedent, session 14. Audited 2026-05-27;
  all 9 enum values present + labeled. PARKING_LOT #44 resolved.
