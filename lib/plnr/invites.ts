import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Planner invite readers (Lock 30 Phase C pt 2). A `plnr_invites` row is a
 * lightweight, revocable buyer→planner invite (migration 089) — NOT an inquiry
 * and NOT an engagement. The planner side reads incoming, non-revoked invites
 * under its own RLS (plnr_tenant_id in current_user_tenants → SELECT/UPDATE).
 *
 * Cross-tenant event-title enrichment is intentionally OUT of scope: the planner
 * has no read on buyer events yet, so we surface event_id only. The planner-side
 * UI shows the message + when it arrived; richer event context lands once a
 * planner→event read path exists.
 */
export type IncomingPlnrInvite = {
  id: string;
  eventId: string;
  message: string | null;
  createdAt: string;
  acceptedAt: string | null;
};

export async function getIncomingPlnrInvites(
  plnrTenantId: string,
): Promise<IncomingPlnrInvite[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plnr_invites")
    .select("id, event_id, message, created_at, accepted_at")
    .eq("plnr_tenant_id", plnrTenantId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      eventId: row.event_id as string,
      message: (row.message as string | null) ?? null,
      createdAt: row.created_at as string,
      acceptedAt: (row.accepted_at as string | null) ?? null,
    };
  });
}
