"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * V-2b Session B: vendor first-response to a booking inquiry. Sets the
 * quoted price + transitions status to 'quoted' + stamps responded_at.
 *
 * Per Jason 2026-05-25 session 22 lock: V-2b ships price-only response.
 * Vendor → org messaging is a V-2c brief. The inquiry's `message` column
 * (from organizer) stays untouched; vendor's quote price lives in
 * `proposed_price_cents`.
 *
 * Allowed transitions: inquiry → quoted, reviewing → quoted. Any other
 * source status is rejected (already responded / terminal state). The DB
 * RLS enforces the vndr_tenant_id ownership; no need to re-verify here.
 */

export type RespondToInquiryInput = {
  inquiryId: string;
  quotedPriceCents: number;
};

export type RespondToInquiryResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function respondToInquiry(
  input: RespondToInquiryInput,
): Promise<RespondToInquiryResult> {
  if (!input.inquiryId) return { ok: false, error: "Missing inquiry id." };
  if (!Number.isInteger(input.quotedPriceCents) || input.quotedPriceCents < 0) {
    return { ok: false, error: "Quote must be 0 or more cents." };
  }
  if (input.quotedPriceCents > 100_000_000) {
    // $1M sanity ceiling — guards against decimal-place typos.
    return { ok: false, error: "Quote too high — check the amount." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_inquiries")
    .update({
      proposed_price_cents: input.quotedPriceCents,
      responded_at: new Date().toISOString(),
      status: "quoted",
    })
    .eq("id", input.inquiryId)
    .in("status", ["inquiry", "reviewing"])
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message ??
        "Update failed — inquiry may already be responded to or in a terminal state.",
    };
  }
  revalidatePath("/vndr/inquiries");
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
