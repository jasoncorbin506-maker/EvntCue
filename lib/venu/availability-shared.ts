/**
 * Client-safe types + constants for venue availability + calendar feeds.
 * Split from lib/venu/availability.ts per Hard Rule #10 (Backstage
 * 02_CLAUDE.md, 2026-05-27): a module with `import "server-only"` must not
 * export pure values that Client Components might import. Types and constants
 * live here; server-side reads stay in availability.ts.
 *
 * Worked examples that followed the same pattern: lib/vndr/packages-shared.ts
 * (V-2b smoke-fix session 23), lib/events/vendor-presence-shared.ts
 * (session 27).
 */

export type BlockSource = "manual" | "csv_import" | "ical_feed" | "connector";

export const BLOCK_SOURCE_VALUES: readonly BlockSource[] = [
  "manual",
  "csv_import",
  "ical_feed",
  "connector",
] as const;

export type AvailabilityBlock = {
  id: string;
  venueTenantId: string;
  /** NULL = whole-venue block. */
  venueSpaceId: string | null;
  blockedDate: string;
  /** NULL = whole-day block (paired with endTime NULL). */
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  source: BlockSource;
  /** Stable external id for re-sync dedup; NULL for manual blocks. */
  sourceRef: string | null;
  /** Back-pointer to venue_calendar_feeds when source = ical_feed. */
  sourceFeedId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarAttestation = {
  id: string;
  venueTenantId: string;
  attestedAt: string;
  attestedBy: string | null;
  createdAt: string;
};

export type VenueSpace = {
  id: string;
  tenantId: string;
  name: string;
  status: string;
};

/**
 * UX-side picker options for the "Connect a calendar" sheet. source_system is
 * a soft tag (DB CHECK accepts these strings + 'other'); copy and help URLs
 * live here so the Sheet can render them without an extra fetch.
 *
 * Session B (iCal subscription UI) consumes this; Session A only references
 * the type so the import path is locked in.
 */
export type SourceSystemOption = {
  id: "google" | "honeybook" | "tripleseat" | "aisle_planner" | "caterease" | "other";
  label: string;
  /** Help-doc anchor for the per-source paste instructions; Session B writes the docs. */
  instructionUrl: string | null;
};

export const SOURCE_SYSTEM_OPTIONS: readonly SourceSystemOption[] = [
  { id: "google", label: "Google Calendar", instructionUrl: "/docs/connect-google-calendar" },
  { id: "honeybook", label: "Honeybook", instructionUrl: "/docs/connect-honeybook" },
  { id: "tripleseat", label: "Tripleseat", instructionUrl: "/docs/connect-tripleseat" },
  { id: "aisle_planner", label: "Aisle Planner", instructionUrl: "/docs/connect-aisle-planner" },
  { id: "caterease", label: "Caterease", instructionUrl: "/docs/connect-caterease" },
  { id: "other", label: "Other (any iCal feed)", instructionUrl: null },
] as const;

/**
 * UX-side label for a block's origin. Used on the manual-blocks list to
 * surface why a block is there ("Synced from Honeybook" vs "Added manually").
 * Plain language per the brief — no "iCal" / "feed" jargon at user-facing layer.
 */
export function formatBlockSource(source: BlockSource): string {
  switch (source) {
    case "manual":
      return "Added manually";
    case "csv_import":
      return "Uploaded from CSV";
    case "ical_feed":
      return "Synced from calendar";
    case "connector":
      return "Synced from system";
  }
}
