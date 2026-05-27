"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";
import { CATEGORY_LABELS } from "@/lib/bookings/cancellation-requests-shared";

/**
 * Organizer approves or denies a vendor's pending cancellation request
 * (V-2c Session 2 Stream B, mig 063).
 *
 *   approve  → booking.status='cancelled' + cancelled_at=now() +
 *              cancellation_reason=category label;
 *              request row gets status='approved' + responded_*
 *   deny     → booking.status='confirmed' (revert from
 *              'cancellation_requested');
 *              request row gets status='denied' + responded_*
 *
 * No money flow yet — refund processing is Phase 4. This action only
 * touches the request + the booking's status / cancelled_at /
 * cancellation_reason columns; vendor_refund_* columns stay untouched.
 */

export type RespondToCancellationRequestInput = {
  requestId: string;
  bookingId: string;
  decision: "approve" | "deny";
};

export type RespondToCancellationRequestResult =
  | { ok: true }
  | { ok: false; error: string };

export async function respondToCancellationRequest(
  input: RespondToCancellationRequestInput,
): Promise<RespondToCancellationRequestResult> {
  if (!input.requestId) return { ok: false, error: "Missing request id." };
  if (!input.bookingId) return { ok: false, error: "Missing booking id." };
  if (input.decision !== "approve" && input.decision !== "deny") {
    return { ok: false, error: "Invalid decision." };
  }

  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();

  // Load the request so we can copy reason_category into bookings.cancellation_reason on approve.
  const { data: requestRow, error: loadErr } = await supabase
    .from("booking_cancellation_requests")
    .select("reason_category, status, booking_id")
    .eq("id", input.requestId)
    .single();
  if (loadErr || !requestRow) {
    return {
      ok: false,
      error: loadErr?.message ?? "Cancellation request not found.",
    };
  }
  if ((requestRow as Record<string, unknown>).status !== "pending") {
    return { ok: false, error: "This request has already been responded to." };
  }
  if (
    (requestRow as Record<string, unknown>).booking_id !== input.bookingId
  ) {
    return { ok: false, error: "Booking / request mismatch." };
  }
  const category = (requestRow as Record<string, unknown>).reason_category as string;

  const newRequestStatus = input.decision === "approve" ? "approved" : "denied";
  const newBookingStatus =
    input.decision === "approve" ? "cancelled" : "confirmed";

  const { error: reqErr } = await supabase
    .from("booking_cancellation_requests")
    .update({
      status: newRequestStatus,
      responded_at: new Date().toISOString(),
      responded_by_user_id: organizer.userId,
    })
    .eq("id", input.requestId);
  if (reqErr) return { ok: false, error: reqErr.message };

  const bookingUpdate: Record<string, unknown> = { status: newBookingStatus };
  if (input.decision === "approve") {
    bookingUpdate.cancelled_at = new Date().toISOString();
    bookingUpdate.cancellation_reason =
      CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
  }
  const { error: bookingErr } = await supabase
    .from("bookings")
    .update(bookingUpdate)
    .eq("id", input.bookingId);
  if (bookingErr) {
    return {
      ok: false,
      error: `Request updated but booking status didn't flip: ${bookingErr.message}`,
    };
  }

  revalidatePath("/orgnz");
  revalidatePath("/vndr/bookings");
  revalidatePath("/vndr");
  return { ok: true };
}
