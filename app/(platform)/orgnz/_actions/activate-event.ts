"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEventHistoryWrite } from "@/lib/events/timing";
import { canActivate, isEventActive } from "@/lib/events/activation";

/**
 * Lock 27 — "Date Set, Ready to Book" activation.
 *
 * Flips an Orgnz event from 'draft' (planning sandbox) to 'active' (real,
 * transactional). This is the gate the booking / inquiry / Stripe creation
 * flows check (see lib/events/activation.ts) — once those land, an event must
 * be active before a real-counterparty touch is allowed.
 *
 * Tenant scoping is enforced app-layer (resolve the caller's orgnz tenant,
 * require event.orgnz_tenant_id === that tenant) on top of RLS — the brief's
 * defensive posture. Idempotent: activating an already-active event is a no-op
 * success. No new migration — `status` already exists; `activated_at` analytics
 * is deferred to Phase 3.
 */

export type ActivateEventResult = { ok: true } | { ok: false; error: string };

export async function activateEventAction(
  eventId: string,
): Promise<ActivateEventResult> {
  if (!eventId) return { ok: false, error: "Missing event." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Your session expired. Sign in again." };
  }

  const admin = createAdminClient();

  // Resolve the caller's orgnz tenant.
  const { data: roles } = await admin
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "orgnz")
    .limit(1);
  const tenantId = (roles?.[0]?.tenant_id as string | undefined) ?? null;
  if (!tenantId) {
    return { ok: false, error: "No organizer profile found." };
  }

  // Load the event, scoped to the tenant (RLS + app-layer).
  const { data: ev, error: readErr } = await admin
    .from("events")
    .select("id, status, start_date, orgnz_tenant_id")
    .eq("id", eventId)
    .maybeSingle();
  if (readErr || !ev || (ev.orgnz_tenant_id as string) !== tenantId) {
    return { ok: false, error: "Event not found." };
  }

  const status = (ev.status as string | null) ?? null;
  // Already real — nothing to do.
  if (isEventActive(status)) return { ok: true };

  const guard = canActivate(status, ev.start_date as string | null);
  if (!guard.ok) {
    return guard.reason === "no_date"
      ? { ok: false, error: "Set a date before making this event real." }
      : { ok: false, error: "This event can't be activated." };
  }

  const { error: updErr } = await admin
    .from("events")
    .update({ status: "active" })
    .eq("id", eventId)
    .eq("orgnz_tenant_id", tenantId);
  if (updErr) {
    return { ok: false, error: "Could not activate the event. Try again." };
  }

  // Audit the lifecycle transition (Lock 23 event_history).
  await logEventHistoryWrite(admin, {
    eventId,
    field: "status",
    oldValue: status,
    newValue: "active",
    userId: user.id,
    reason: "Organizer confirmed — Date Set, Ready to Book",
  });

  revalidatePath("/orgnz");
  return { ok: true };
}
