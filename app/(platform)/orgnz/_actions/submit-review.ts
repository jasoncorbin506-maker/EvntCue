"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";

/**
 * Organizer submits a review for a vendor that worked on one of their
 * past events. Mirror of the vndr-side action with reviewer_role='orgnz'
 * + reviewee_role='vndr'.
 */

const MAX_BODY = 4000;

export type SubmitReviewInput = {
  eventId: string;
  revieweeTenantId: string;
  rating: number;
  body?: string;
};

export type SubmitReviewResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function submitReview(
  input: SubmitReviewInput,
): Promise<SubmitReviewResult> {
  if (!input.eventId) return { ok: false, error: "Missing event id." };
  if (!input.revieweeTenantId) return { ok: false, error: "Missing reviewee." };
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Rating must be 1–5." };
  }
  const body = input.body?.trim() ?? "";
  if (body.length > MAX_BODY) {
    return { ok: false, error: `Review too long (${MAX_BODY} max).` };
  }

  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_reviews")
    .insert({
      event_id: input.eventId,
      reviewer_tenant_id: organizer.tenantId,
      reviewer_role: "orgnz",
      reviewee_tenant_id: input.revieweeTenantId,
      reviewee_role: "vndr",
      rating: input.rating,
      body: body.length > 0 ? body : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message ??
        "Review submit failed — you may have already reviewed this Vndr on this event.",
    };
  }
  revalidatePath("/orgnz");
  return { ok: true, id: data.id as string };
}
