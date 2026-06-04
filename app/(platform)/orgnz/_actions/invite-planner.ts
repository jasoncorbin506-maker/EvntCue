"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";

/**
 * Buyer→planner invite (Lock 30 Phase C pt 2). The organizer invites a planner
 * TENANT to plan a specific event. Backed by plnr_invites (migration 089) — a
 * lightweight, revocable invite, NOT an inquiry (Lock 28 rejects plnr from the
 * inquiry path) and NOT an engagement.
 *
 * Mirrors moodboard-invite.ts's auth/tenant resolution + upsert-on-conflict:
 * the (event_id, plnr_tenant_id) unique key means a re-invite is idempotent, and
 * un-revoking a previously-revoked row clears revoked_at. event_id comes from the
 * buyer's active-event context (passed from the invite sheet).
 */

export type InvitePlannerResult = { ok: true } | { ok: false; error: string };

export async function invitePlanner(input: {
  plnrTenantId: string;
  eventId: string;
  message: string;
}): Promise<InvitePlannerResult> {
  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, error: "Not signed in." };
  if (!input.plnrTenantId) return { ok: false, error: "Missing planner." };
  if (!input.eventId) return { ok: false, error: "Pick which event this invite is for." };

  const supabase = await createClient();
  // Upsert on (event_id, plnr_tenant_id) — re-inviting the same planner for the
  // same event is idempotent, and a previously-revoked row gets un-revoked by
  // clearing revoked_at. The pair is a plain unique key (safe onConflict).
  const { error } = await supabase
    .from("plnr_invites")
    .upsert(
      {
        event_id: input.eventId,
        plnr_tenant_id: input.plnrTenantId,
        buyer_tenant_id: organizer.tenantId,
        invited_by: organizer.userId,
        message: input.message.trim() || null,
        revoked_at: null,
      },
      { onConflict: "event_id,plnr_tenant_id" },
    );
  if (error) return { ok: false, error: "Couldn't send your invite — please try again." };

  revalidatePath("/orgnz/browse");
  return { ok: true };
}
