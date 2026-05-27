"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVenue } from "@/lib/venu/current-venue";

/**
 * Create a venue availability block (migration 066). Used by
 * AvailabilityBlockSheet — single-date manual block, optional per-space,
 * optional partial-day window.
 *
 * Validates the TOD pair (mirrors the DB CHECK) so the round-trip is clean
 * on bad input. RLS venue_vab_insert scopes to venue_tenant_id ∈
 * current_user_tenants(); spoofing tenant ids in the payload is rejected
 * server-side regardless of this action's validation.
 *
 * Mirror of app/(platform)/vndr/_actions/upsert-availability-block.ts. The
 * venue side is create-only for Session A (no edit affordance on the list);
 * Session B's CSV/iCal flow doesn't go through this action either (it writes
 * blocks with source != 'manual' via worker).
 */

export type CreateAvailabilityBlockInput = {
  /** ISO date (YYYY-MM-DD). */
  blockedDate: string;
  /** NULL = whole-venue. UUID of a venue_spaces row owned by the same tenant. */
  venueSpaceId: string | null;
  /** NULL/NULL = whole-day block. Both set = partial-day, end > start. */
  startTime: string | null;
  endTime: string | null;
  reason?: string | null;
};

export type CreateAvailabilityBlockResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isHHMMSS(s: string): boolean {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(s);
}

export async function createAvailabilityBlock(
  input: CreateAvailabilityBlockInput,
): Promise<CreateAvailabilityBlockResult> {
  if (!isIsoDate(input.blockedDate)) {
    return { ok: false, error: "Invalid date." };
  }
  const startSet = input.startTime !== null;
  const endSet = input.endTime !== null;
  if (startSet !== endSet) {
    return { ok: false, error: "Pick both start and end times, or neither." };
  }
  if (startSet && endSet) {
    if (!isHHMMSS(input.startTime!) || !isHHMMSS(input.endTime!)) {
      return { ok: false, error: "Invalid time format." };
    }
    if (input.endTime! <= input.startTime!) {
      return { ok: false, error: "End time must be after start time." };
    }
  }

  const venue = await getCurrentVenue();
  if (!venue) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("venue_availability_blocks")
    .insert({
      venue_tenant_id: venue.tenantId,
      venue_space_id: input.venueSpaceId,
      blocked_date: input.blockedDate,
      start_time: input.startTime,
      end_time: input.endTime,
      reason: input.reason ?? null,
      source: "manual",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed." };
  }

  revalidatePath("/venu/availability");
  revalidatePath("/venu/discover");
  return { ok: true, id: data.id as string };
}
