import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side reads for event_reviews (mig 062, V-2c Session 2 Stream A).
 *
 * Bidirectional review system: organizer reviews vendor + vendor reviews
 * organizer (one row per direction per event, enforced by unique index).
 * V-2c surface is private — reviews feed the trust-score reviews
 * sub-metric (40% weight) but don't render publicly until V-2d Discover.
 *
 * Trigger: 24h-after-event derived-state check on dashboard load. No
 * scheduled-job infra; getPendingReviewPrompts() returns events that
 * are past T+24h AND don't yet have a review from the caller.
 */

export type EventReviewerRole = "orgnz" | "vndr";

export type EventReview = {
  id: string;
  eventId: string;
  reviewerTenantId: string;
  reviewerRole: EventReviewerRole;
  revieweeTenantId: string;
  revieweeRole: EventReviewerRole;
  rating: number;
  body: string | null;
  createdAt: string;
};

export type ReviewAggregate = {
  count: number;
  average: number; // 0–5, 1 decimal
};

export type PendingReviewPrompt = {
  bookingId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  counterpartyTenantId: string;
  counterpartyDisplayName: string | null;
  counterpartyRole: EventReviewerRole;
};

const REVIEW_PROMPT_MIN_HOURS_AFTER_EVENT = 24;

/**
 * Aggregate (count + average rating) for a reviewee tenant. Used by
 * the vendor trust-score reviews sub-metric and (eventually) the
 * public vendor profile surface.
 */
export async function getReviewAggregateForTenant(
  revieweeTenantId: string,
): Promise<ReviewAggregate> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_reviews")
    .select("rating")
    .eq("reviewee_tenant_id", revieweeTenantId)
    .is("deleted_at", null);
  const rows = data ?? [];
  if (rows.length === 0) return { count: 0, average: 0 };
  const total = rows.reduce(
    (sum, r) => sum + ((r as Record<string, unknown>).rating as number),
    0,
  );
  return {
    count: rows.length,
    average: Math.round((total / rows.length) * 10) / 10,
  };
}

/**
 * Pending review prompts for a vendor: bookings (status='completed' OR
 * past T+24h) where the vendor hasn't yet reviewed the organizer.
 * Returns at most 5 (UI surface is a small dashboard card; the user
 * can clear the queue by reviewing one at a time).
 */
export async function getPendingReviewPromptsForVendor(
  vendorTenantId: string,
): Promise<PendingReviewPrompt[]> {
  const supabase = await createClient();
  const cutoffIso = new Date(
    Date.now() - REVIEW_PROMPT_MIN_HOURS_AFTER_EVENT * 60 * 60 * 1000,
  ).toISOString();

  // Bookings the vendor was on, past T+24h relative to event start
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, event_id, status, created_at")
    .eq("vndr_tenant_id", vendorTenantId)
    .in("status", ["confirmed", "completed"]);
  const bookingRows = (bookings ?? []) as Record<string, unknown>[];
  if (bookingRows.length === 0) return [];

  const eventIds = Array.from(
    new Set(bookingRows.map((b) => b.event_id as string)),
  );
  const { data: events } = await supabase
    .from("events")
    .select("id, name, start_date, orgnz_tenant_id")
    .in("id", eventIds)
    .lt("start_date", cutoffIso.slice(0, 10));
  const eventById = new Map<string, Record<string, unknown>>();
  for (const e of events ?? []) {
    eventById.set((e as Record<string, unknown>).id as string, e as Record<string, unknown>);
  }

  // Strip bookings whose event is in the future / within the 24h grace window
  const eligible = bookingRows.filter((b) => eventById.has(b.event_id as string));
  if (eligible.length === 0) return [];

  // Filter out events the vendor has already reviewed
  const eligibleEventIds = eligible.map((b) => b.event_id as string);
  const { data: existing } = await supabase
    .from("event_reviews")
    .select("event_id")
    .eq("reviewer_tenant_id", vendorTenantId)
    .eq("reviewer_role", "vndr")
    .is("deleted_at", null)
    .in("event_id", eligibleEventIds);
  const reviewedEventIds = new Set(
    (existing ?? []).map((r) => (r as Record<string, unknown>).event_id as string),
  );

  const pending = eligible.filter((b) => !reviewedEventIds.has(b.event_id as string));
  if (pending.length === 0) return [];

  // Resolve organizer display name via tenants→users path
  // (orgnz tenant doesn't have a single canonical display name; use the
  // event name as the human-readable handle for the prompt copy)
  return pending.slice(0, 5).map((b) => {
    const ev = eventById.get(b.event_id as string)!;
    return {
      bookingId: b.id as string,
      eventId: b.event_id as string,
      eventName: (ev.name as string) ?? "Event",
      eventDate: (ev.start_date as string) ?? "",
      counterpartyTenantId: ev.orgnz_tenant_id as string,
      counterpartyDisplayName: (ev.name as string) ?? null,
      counterpartyRole: "orgnz" as const,
    };
  });
}

/**
 * Pending review prompts for an organizer: events past T+24h where the
 * organizer hasn't yet reviewed each vendor on the event. One prompt
 * per (event, vendor) pair so the organizer reviews each vendor
 * separately rather than one blanket review per event.
 */
export async function getPendingReviewPromptsForOrganizer(
  orgnzTenantId: string,
): Promise<PendingReviewPrompt[]> {
  const supabase = await createClient();
  const cutoffIso = new Date(
    Date.now() - REVIEW_PROMPT_MIN_HOURS_AFTER_EVENT * 60 * 60 * 1000,
  ).toISOString();

  // Organizer's events past T+24h
  const { data: events } = await supabase
    .from("events")
    .select("id, name, start_date")
    .eq("orgnz_tenant_id", orgnzTenantId)
    .lt("start_date", cutoffIso.slice(0, 10));
  const eventRows = (events ?? []) as Record<string, unknown>[];
  if (eventRows.length === 0) return [];

  const eventIds = eventRows.map((e) => e.id as string);
  const eventById = new Map<string, Record<string, unknown>>(
    eventRows.map((e) => [e.id as string, e]),
  );

  // Bookings on those events
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, event_id, vndr_tenant_id, status")
    .in("event_id", eventIds)
    .in("status", ["confirmed", "completed"]);
  const bookingRows = (bookings ?? []) as Record<string, unknown>[];
  if (bookingRows.length === 0) return [];

  // Existing reviews authored by this organizer
  const { data: existing } = await supabase
    .from("event_reviews")
    .select("event_id, reviewee_tenant_id")
    .eq("reviewer_tenant_id", orgnzTenantId)
    .eq("reviewer_role", "orgnz")
    .is("deleted_at", null)
    .in("event_id", eventIds);
  const reviewedKey = new Set(
    (existing ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return `${row.event_id as string}|${row.reviewee_tenant_id as string}`;
    }),
  );

  // Pending = each (event, vendor) pair not yet reviewed
  const pending = bookingRows.filter(
    (b) =>
      !reviewedKey.has(`${b.event_id as string}|${b.vndr_tenant_id as string}`),
  );
  if (pending.length === 0) return [];

  // Resolve vendor display names in batch
  const vndrTenantIds = Array.from(
    new Set(pending.map((b) => b.vndr_tenant_id as string)),
  );
  const { data: vendorRows } = await supabase
    .from("vendors")
    .select("tenant_id, display_name")
    .in("tenant_id", vndrTenantIds);
  const nameByTenant = new Map<string, string>();
  for (const v of vendorRows ?? []) {
    nameByTenant.set(
      (v as Record<string, unknown>).tenant_id as string,
      ((v as Record<string, unknown>).display_name as string | null) ?? "",
    );
  }

  return pending.slice(0, 5).map((b) => {
    const ev = eventById.get(b.event_id as string)!;
    return {
      bookingId: b.id as string,
      eventId: b.event_id as string,
      eventName: (ev.name as string) ?? "Event",
      eventDate: (ev.start_date as string) ?? "",
      counterpartyTenantId: b.vndr_tenant_id as string,
      counterpartyDisplayName: nameByTenant.get(b.vndr_tenant_id as string) ?? null,
      counterpartyRole: "vndr" as const,
    };
  });
}
