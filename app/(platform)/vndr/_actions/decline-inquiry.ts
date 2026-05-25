"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * V-2b smoke-fix (session 23 — 2026-05-25 — brief G2): vendor declines a
 * booking inquiry. Transitions status to `closed` (which falls under the
 * "Lost" filter chip per Jason's session 22 filter mapping). RLS gates the
 * write via vndr_tenant_id; the .in() guard rejects already-committed
 * inquiries.
 *
 * Allowed source statuses: inquiry, reviewing, quoted. Penciled / inked /
 * booked are commitments that need the cancellation flow (V-2c, Lock 24
 * territory), NOT decline.
 *
 * No `decline_reason` column on booking_inquiries (verified via Supabase
 * MCP at session start). V-2b ships status-only decline; reason capture
 * is a V-2c brief if user feedback warrants.
 */

export type DeclineInquiryResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function declineInquiry(
  inquiryId: string,
): Promise<DeclineInquiryResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_inquiries")
    .update({
      status: "closed",
      responded_at: new Date().toISOString(),
    })
    .eq("id", inquiryId)
    .in("status", ["inquiry", "reviewing", "quoted"])
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message ??
        "Decline failed — inquiry may already be at a committed state.",
    };
  }
  revalidatePath("/vndr/inquiries");
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
