"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { EventNotificationResponse } from "@/lib/events/event-notifications-shared";

/**
 * Vendor accept/decline/undo actions on a date-change notification.
 *
 * All writes happen via the authenticated client — RLS gates the UPDATE
 * to rows where `vendor_tenant_id IN current_user_tenants()` (Chunk A
 * policy `event_notifications_update`). App-layer enforces:
 *
 *   - Accept / decline transition only from `pending`
 *   - Undo transition (Lock 22 8s window) only from `accepted` or
 *     `declined`, back to `pending`. The `resolved_at` clears too.
 *
 * Stale-decision races (e.g., orgnz commits a new supersession between the
 * vendor's tap and the UPDATE) are handled by the WHERE clause: we only
 * flip rows that are still in the expected pre-state.
 */

export type RespondResult =
  | { ok: true }
  | { ok: false; error: string };

async function transitionResponse(
  notificationId: string,
  from: EventNotificationResponse,
  to: EventNotificationResponse,
): Promise<RespondResult> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const update: Record<string, unknown> = {
    vendor_response: to,
    resolved_at: to === "pending" ? null : nowIso,
  };

  const { data, error } = await supabase
    .from("event_notifications")
    .update(update)
    .eq("id", notificationId)
    .eq("vendor_response", from)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data || data.length === 0) {
    return {
      ok: false,
      error: `This change is no longer ${from} — it may have been superseded by a newer change.`,
    };
  }

  // Inquiries surface + the detail page both consume this state.
  revalidatePath("/vndr/inquiries");
  revalidatePath(`/vndr/inquiries/date-change/${notificationId}`);
  return { ok: true };
}

export async function acceptDateChange(
  notificationId: string,
): Promise<RespondResult> {
  return transitionResponse(notificationId, "pending", "accepted");
}

export async function declineDateChange(
  notificationId: string,
): Promise<RespondResult> {
  return transitionResponse(notificationId, "pending", "declined");
}

/**
 * Reverse a vendor's accept/decline within the Lock 22 8s undo window.
 * Caller passes the prior response so the WHERE clause can guard against
 * accidental double-undo (only flips if the row is still in the expected
 * post-state).
 */
export async function undoEventNotificationResponse(
  notificationId: string,
  priorResponse: "accepted" | "declined",
): Promise<RespondResult> {
  return transitionResponse(notificationId, priorResponse, "pending");
}
