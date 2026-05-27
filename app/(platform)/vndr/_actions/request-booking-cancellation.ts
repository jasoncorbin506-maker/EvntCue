"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import {
  CANCELLATION_CATEGORIES,
  type CancellationCategory,
} from "@/lib/bookings/cancellation-requests-shared";

/**
 * Vendor requests cancellation of one of their confirmed bookings (V-2c
 * Session 2 Stream B, mig 063). On insert, also flips the booking's
 * status to 'cancellation_requested' so the organizer sees the request
 * surfaced as a state on their dashboard.
 *
 * No money flow — Phase 4 handles the refund logic when the organizer
 * eventually approves. V-2c just captures the ask + flips the status.
 */

const MAX_REASON_TEXT = 2000;

export type RequestBookingCancellationInput = {
  bookingId: string;
  reasonCategory: CancellationCategory;
  reasonText?: string;
};

export type RequestBookingCancellationResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

export async function requestBookingCancellation(
  input: RequestBookingCancellationInput,
): Promise<RequestBookingCancellationResult> {
  if (!input.bookingId) return { ok: false, error: "Missing booking id." };
  if (!CANCELLATION_CATEGORIES.includes(input.reasonCategory)) {
    return { ok: false, error: "Invalid reason category." };
  }
  const reasonText = input.reasonText?.trim() ?? "";
  if (reasonText.length > MAX_REASON_TEXT) {
    return { ok: false, error: `Reason too long (${MAX_REASON_TEXT} max).` };
  }

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data: request, error: insertErr } = await supabase
    .from("booking_cancellation_requests")
    .insert({
      booking_id: input.bookingId,
      requested_by_tenant_id: vendor.tenantId,
      requested_by_role: "vndr",
      reason_category: input.reasonCategory,
      reason_text: reasonText.length > 0 ? reasonText : null,
    })
    .select("id")
    .single();

  if (insertErr || !request) {
    return {
      ok: false,
      error:
        insertErr?.message ??
        "Could not file cancellation request — a request may already be pending for this booking.",
    };
  }

  // Flip the booking status so the organizer sees something in flux.
  // Best-effort: if this UPDATE fails for any reason, the request row is
  // already in place — organizer will still see it via their pending
  // requests query. Don't roll back; flag the partial state.
  const { error: statusErr } = await supabase
    .from("bookings")
    .update({ status: "cancellation_requested" })
    .eq("id", input.bookingId);
  if (statusErr) {
    return {
      ok: false,
      error: `Request filed but booking status didn't update: ${statusErr.message}`,
    };
  }

  revalidatePath("/vndr/bookings");
  revalidatePath("/vndr");
  revalidatePath("/orgnz");
  return { ok: true, requestId: request.id as string };
}
