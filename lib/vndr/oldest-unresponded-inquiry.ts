import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Vendor Home — Response Window Alert source (per V-2b brief §1). Returns
 * the single oldest unresponded inquiry for the vendor along with a 24-hour
 * SLA deadline. Returns null when no unresponded inquiries exist (the alert
 * suppresses entirely — the brief explicitly says "don't show '0 active
 * inquiries'").
 *
 * SLA window: global 24h per Jason's V-2b open-question lock 2026-05-24.
 * Per-event SLA variation is a future scope.
 *
 * "Unresponded" = `responded_at IS NULL` (the canonical `inquiries`
 * schema; brief said `first_response_at` which is the conceptual name — the
 * actual column is `responded_at`).
 */

export const VNDR_RESPONSE_SLA_HOURS = 24;

export type OldestUnrespondedInquiry = {
  inquiryId: string;
  eventName: string;
  eventDate: string;
  createdAt: string;
  deadlineMs: number;
  isOverdue: boolean;
};

export async function getOldestUnrespondedInquiry(
  vendorTenantId: string,
): Promise<OldestUnrespondedInquiry | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select(
      "id, event_id, event_date, created_at, events!booking_inquiries_event_id_fkey(name)",
    )
    .eq("recipient_tenant_id", vendorTenantId)
    .eq("status", "inquiry")
    .is("responded_at", null)
    .order("created_at", { ascending: true })
    .limit(1);

  const row = data?.[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  const createdAt = row.created_at as string;
  const createdMs = new Date(createdAt).getTime();
  const deadlineMs = createdMs + VNDR_RESPONSE_SLA_HOURS * 60 * 60 * 1000;
  const isOverdue = Date.now() > deadlineMs;

  const eventsField = row.events as Record<string, unknown> | Record<string, unknown>[] | null;
  const ev = (Array.isArray(eventsField) ? eventsField[0] : eventsField) ?? {};
  const eventName = (ev.name as string | null) ?? "Untitled event";

  return {
    inquiryId: row.id as string,
    eventName,
    eventDate: (row.event_date as string | null) ?? "",
    createdAt,
    deadlineMs,
    isOverdue,
  };
}
