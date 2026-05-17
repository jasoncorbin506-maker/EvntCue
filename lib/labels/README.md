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

These map the EN display string for now. When per-portal Spanish coverage lands (Phase 5+ per-portal pass), each module exports a `commissionFlowLabel(locale)` function instead of a static record, sourcing from `messages/{en,es}/labels.json`. v1 is EN-only on the back-of-house surfaces; Spanish is wired on the public/pre-auth funnel (Phase 3.3) and Orgnz chrome.

## Audit queue (from Venu lock 2026-05-13)

Modules to create as their enums hit the UI:

- `event-subtypes.ts` — `hindu_wedding`, `bar_mitzvah`, etc. need human-readable labels before any subtype value surfaces in UI copy. Catch during Vndr/Catr/Plnr port sessions. PARKING_LOT #41.
- `inquiry-status.ts` — `inked` may need to read as `signed` to first-time users. Confirm during Venu Inquiries-tab port. PARKING_LOT #42.
- `vendor-categories.ts` — short DB codes ("DJ", "MC") expand in Cue prose ("DJ or master of ceremonies"). PARKING_LOT #43.
- `commission-flows.ts` — shipped session 14 as the Lock 15 precedent. PARKING_LOT #44.
