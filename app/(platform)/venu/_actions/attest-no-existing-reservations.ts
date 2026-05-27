"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVenue } from "@/lib/venu/current-venue";

/**
 * Upsert the venue_calendar_attestations row for the signed-in venue
 * (migration 066). Used by the onboarding-gate "No existing reservations"
 * affordance — presence of a row = attested. Idempotent: re-running on a
 * venue that's already attested updates attested_at + attested_by to the
 * latest user (audit trail).
 *
 * Per Lock 22 forgiveness pattern: the user can always undo the attestation
 * by subscribing a feed or uploading a CSV later. This is a starting state,
 * not a one-way door.
 */

export type AttestResult = { ok: true } | { ok: false; error: string };

export async function attestNoExistingReservations(): Promise<AttestResult> {
  const venue = await getCurrentVenue();
  if (!venue) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("venue_calendar_attestations")
    .upsert(
      {
        venue_tenant_id: venue.tenantId,
        attested_at: new Date().toISOString(),
        attested_by: user.id,
      },
      { onConflict: "venue_tenant_id" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/venu/availability");
  revalidatePath("/venu/discover");
  return { ok: true };
}
