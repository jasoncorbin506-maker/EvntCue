"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPlanner } from "@/lib/plnr/current-planner";

/**
 * Accept an incoming planner invite (Lock 30 Phase C pt 2). Stamps accepted_at
 * on the planner's own plnr_invites row. The write rides the planner-side RLS
 * (plnr_tenant_id in current_user_tenants may UPDATE its own rows); the explicit
 * plnr_tenant_id filter keeps the update scoped even though the policy already
 * does. Idempotent: re-accepting a previously-accepted invite is a no-op.
 *
 * This is NOT an inquiry response — planners engage via invite only (Lock 28),
 * and accepting simply marks the planner's interest; richer engagement lands in
 * a later PR.
 */

export type AcceptInviteResult = { ok: true } | { ok: false; error: string };

export async function acceptPlnrInvite(inviteId: string): Promise<AcceptInviteResult> {
  const planner = await getCurrentPlanner();
  if (!planner) return { ok: false, error: "Not signed in." };
  if (!inviteId) return { ok: false, error: "Missing invite." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plnr_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("plnr_tenant_id", planner.tenantId)
    .is("accepted_at", null)
    .is("revoked_at", null);
  if (error) return { ok: false, error: "Couldn't accept the invite — please try again." };

  revalidatePath("/plnr/invites");
  revalidatePath("/plnr");
  return { ok: true };
}
