"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCaterer } from "@/lib/catr/current-caterer";

/**
 * Caterer first-response to an inquiry: sets the quoted price, transitions
 * status to 'quoted', and stamps responded_at. Mirrors the vndr
 * `respondToInquiry` — catr is an expanded Vndr at the inquiry layer (Lock 77),
 * so the same `proposed_price_cents` column carries the seller's quote. The
 * organizer-supplied `est_revenue_cents` (lead estimate) is left untouched.
 *
 * Allowed transitions: inquiry → quoted, reviewing → quoted. Other source
 * states are rejected. RLS's inq_update gates the write to the recipient
 * tenant (role-agnostic), so an id from another tenant updates 0 rows.
 */

export type RespondToCatrInquiryInput = {
  inquiryId: string;
  quotedPriceCents: number;
};

export type RespondToCatrInquiryResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function respondToCatrInquiry(
  input: RespondToCatrInquiryInput,
): Promise<RespondToCatrInquiryResult> {
  if (!input.inquiryId) return { ok: false, error: "Missing inquiry id." };
  if (!Number.isInteger(input.quotedPriceCents) || input.quotedPriceCents < 0) {
    return { ok: false, error: "Quote must be 0 or more cents." };
  }
  if (input.quotedPriceCents > 100_000_000) {
    // $1M sanity ceiling — guards against decimal-place typos.
    return { ok: false, error: "Quote too high — check the amount." };
  }

  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
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
  revalidatePath("/catr/inquiries");
  revalidatePath("/catr");
  return { ok: true, id: data.id as string };
}
