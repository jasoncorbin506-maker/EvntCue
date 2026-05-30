"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCaterer } from "@/lib/catr/current-caterer";

/**
 * Caterer places (or releases) a tentative hold on a quoted inquiry. Mirrors
 * the vndr hold flow — catr is an expanded Vndr at the inquiry layer (Lock 77).
 * A hold is status 'penciled' + an `expires_at` deadline; a soft commitment
 * short of a signed booking.
 *
 *   holdCatrInquiry:  quoted   → penciled  (+ expires_at = now + 7d)
 *   releaseCatrHold:  penciled → quoted    (clears expires_at)
 *
 * RLS's inq_update gates the write to the recipient tenant.
 */

const HOLD_DAYS = 7;

export type HoldCatrInquiryResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function holdCatrInquiry(inquiryId: string): Promise<HoldCatrInquiryResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };

  const expiresAt = new Date(Date.now() + HOLD_DAYS * 86_400_000).toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .update({ status: "penciled", expires_at: expiresAt })
    .eq("id", inquiryId)
    .eq("status", "quoted")
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Hold failed — inquiry must be quoted first.",
    };
  }
  revalidatePath("/catr/inquiries");
  revalidatePath("/catr");
  return { ok: true, id: data.id as string };
}

export async function releaseCatrHold(inquiryId: string): Promise<HoldCatrInquiryResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

  const caterer = await getCurrentCaterer();
  if (!caterer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .update({ status: "quoted", expires_at: null })
    .eq("id", inquiryId)
    .eq("status", "penciled")
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Release failed — inquiry is not on hold.",
    };
  }
  revalidatePath("/catr/inquiries");
  revalidatePath("/catr");
  return { ok: true, id: data.id as string };
}
