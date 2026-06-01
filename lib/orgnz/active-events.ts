import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizer } from "./current-organizer";
import { formatStartDateMedium } from "@/app/(platform)/orgnz/_lib/load-context";
import { humanizeEventType } from "@/lib/events/event-picker";

/**
 * Active events for the buyer's send-inquiry picker (Phase 4 R4a).
 *
 * An inquiry is a real-counterparty touch, so Lock 27 requires its parent event
 * to be `active` (see lib/events/activation.ts — drafts/planning can't transact).
 * The picker therefore lists ONLY active events; if the buyer has none, the
 * send-inquiry sheet routes them to the activation affordance instead of letting
 * them compose a message the server will reject with EVENT_NOT_ACTIVATED.
 *
 * Read under the organizer's own session (RLS: orgnz owns its events) — no admin
 * client needed, unlike the Chrome's load-context which resolves a URL-driven
 * selection across all states.
 */
export type InquiryEventOption = {
  id: string;
  name: string;
  startDate: string | null;
  dateLabel: string | null;
  guestCount: number | null;
  /** Humanized event type, e.g. "Wedding". */
  typeLabel: string | null;
  /** Raw subtype if set, e.g. "hindu". */
  subtype: string | null;
};

export async function getOrgnzActiveEvents(): Promise<InquiryEventOption[]> {
  const organizer = await getCurrentOrganizer();
  if (!organizer) return [];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("events")
    .select("id, name, start_date, guest_count, event_type, event_subtype")
    .eq("orgnz_tenant_id", organizer.tenantId)
    .eq("status", "active")
    .order("start_date", { ascending: true });

  return (rows ?? []).map((r) => {
    const startDate = (r.start_date as string | null) ?? null;
    const eventType = (r.event_type as string | null) ?? null;
    return {
      id: r.id as string,
      name: (r.name as string | null) ?? "Untitled event",
      startDate,
      dateLabel: startDate ? formatStartDateMedium(startDate) : null,
      guestCount: (r.guest_count as number | null) ?? null,
      typeLabel: eventType ? humanizeEventType(eventType) : null,
      subtype: (r.event_subtype as string | null) ?? null,
    };
  });
}
