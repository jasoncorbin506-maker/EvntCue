"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Vendor places (or releases) a tentative hold on a quoted inquiry. A hold is
 * status 'penciled' + an `expires_at` deadline — the date reads "Hold ·
 * expires …" on the venu/vndr surfaces. It's a soft commitment short of a
 * signed booking ('inked'); either side can let it lapse.
 *
 *   holdInquiry:  quoted   → penciled  (+ expires_at = now + 7d)
 *   releaseHold:  penciled → quoted    (clears expires_at)
 *
 * RLS's inq_update gates the write to the recipient tenant. The .in() guard
 * rejects any out-of-sequence source state.
 */

const HOLD_DAYS = 7;

export type HoldInquiryResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function holdInquiry(inquiryId: string): Promise<HoldInquiryResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

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
  revalidatePath("/vndr/inquiries");
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}

export async function releaseHold(inquiryId: string): Promise<HoldInquiryResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

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
  revalidatePath("/vndr/inquiries");
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
