import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  AvailabilityBlock,
  CalendarAttestation,
} from "./availability-shared";

/**
 * Server-side reads for venue_availability_blocks + venue_calendar_attestations
 * (migrations 066 + 067, venue-calendar arc Session A). RLS-scoped to the
 * caller's tenant via the `venue_tenant_id IN current_user_tenants()` policies.
 *
 * Types live in availability-shared.ts so Client Components can import them
 * without dragging "server-only" into the build graph (Hard Rule #10).
 *
 * Parallel reference: lib/vndr/availability.ts (mig 051 vendor side).
 */

const BLOCK_COLS =
  "id, venue_tenant_id, venue_space_id, blocked_date, start_time, end_time, reason, source, source_ref, source_feed_id, created_by, created_at, updated_at";

const ATTESTATION_COLS =
  "id, venue_tenant_id, attested_at, attested_by, created_at";

function shapeBlock(row: Record<string, unknown>): AvailabilityBlock {
  return {
    id: row.id as string,
    venueTenantId: row.venue_tenant_id as string,
    venueSpaceId: (row.venue_space_id as string | null) ?? null,
    blockedDate: row.blocked_date as string,
    startTime: (row.start_time as string | null) ?? null,
    endTime: (row.end_time as string | null) ?? null,
    reason: (row.reason as string | null) ?? null,
    source: row.source as AvailabilityBlock["source"],
    sourceRef: (row.source_ref as string | null) ?? null,
    sourceFeedId: (row.source_feed_id as string | null) ?? null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function shapeAttestation(row: Record<string, unknown>): CalendarAttestation {
  return {
    id: row.id as string,
    venueTenantId: row.venue_tenant_id as string,
    attestedAt: row.attested_at as string,
    attestedBy: (row.attested_by as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

/**
 * All blocks for a venue, newest first. Used by /venu/availability page.
 * Range filtering happens in JS; ~hundreds of blocks per venue per year is
 * the realistic ceiling, so a single fetch + JS group-by-month is fine.
 */
export async function getVenueAvailabilityBlocks(
  venueTenantId: string,
): Promise<AvailabilityBlock[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_availability_blocks")
    .select(BLOCK_COLS)
    .eq("venue_tenant_id", venueTenantId)
    .order("blocked_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true });
  return (data ?? []).map((row) => shapeBlock(row as Record<string, unknown>));
}

/**
 * Blocks for a single date (any space). Mirrors the vendor-side
 * getVndrAvailabilityBlocksForDate signature shape.
 */
export async function getVenueAvailabilityBlocksForDate(
  venueTenantId: string,
  isoDate: string,
): Promise<AvailabilityBlock[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_availability_blocks")
    .select(BLOCK_COLS)
    .eq("venue_tenant_id", venueTenantId)
    .eq("blocked_date", isoDate)
    .order("start_time", { ascending: true, nullsFirst: true });
  return (data ?? []).map((row) => shapeBlock(row as Record<string, unknown>));
}

/**
 * Calendar attestation row for a venue tenant. Returns null if the venue
 * hasn't attested. Presence IS attestation (per Jason 2026-05-27 schema
 * decision — no redundant boolean column).
 */
export async function getCalendarAttestation(
  venueTenantId: string,
): Promise<CalendarAttestation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_calendar_attestations")
    .select(ATTESTATION_COLS)
    .eq("venue_tenant_id", venueTenantId)
    .maybeSingle();
  if (!data) return null;
  return shapeAttestation(data as Record<string, unknown>);
}

/**
 * Discover-gating predicate. A venue is "calendar-attached" if any of:
 *   - has at least one venue_calendar_feeds row (iCal subscribed)
 *   - has at least one block with source ∈ ('csv_import','ical_feed')
 *   - has a venue_calendar_attestations row (explicit "no existing reservations")
 *
 * V-2d Discover will call this to filter the listing query. As of Session A
 * 2026-05-27 the public Discover route is unbuilt — see lib/discover/venues.ts
 * for the forward-looking facade.
 *
 * Three small queries instead of one OR predicate so a 1-result short-circuit
 * keeps the cost trivial in the common case (every signed-up venue calls
 * this on every onboarding-banner render).
 */
export async function hasVenueAttachedCalendar(
  venueTenantId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { count: feedCount } = await supabase
    .from("venue_calendar_feeds")
    .select("id", { count: "exact", head: true })
    .eq("venue_tenant_id", venueTenantId);
  if ((feedCount ?? 0) > 0) return true;

  const { count: importedBlockCount } = await supabase
    .from("venue_availability_blocks")
    .select("id", { count: "exact", head: true })
    .eq("venue_tenant_id", venueTenantId)
    .in("source", ["csv_import", "ical_feed"]);
  if ((importedBlockCount ?? 0) > 0) return true;

  const { count: attestationCount } = await supabase
    .from("venue_calendar_attestations")
    .select("id", { count: "exact", head: true })
    .eq("venue_tenant_id", venueTenantId);
  return (attestationCount ?? 0) > 0;
}
