"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * Vendor submits a review for the organizer they worked with on a
 * completed event (mig 062). 5-star rating + optional text body up to
 * 4000 chars. RLS gates the INSERT to the vendor's tenant; uniqueness
 * (event_id, reviewer_tenant_id, reviewee_tenant_id) prevents
 * duplicate reviews per direction per event.
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

  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_reviews")
    .insert({
      event_id: input.eventId,
      reviewer_tenant_id: vendor.tenantId,
      reviewer_role: "vndr",
      reviewee_tenant_id: input.revieweeTenantId,
      reviewee_role: "orgnz",
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
        "Review submit failed — you may have already reviewed this event.",
    };
  }
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}
