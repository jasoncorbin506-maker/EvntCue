"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PHASE_ORDER } from "@/data/run-of-show/dispatch";
import type { RoSPhase } from "@/data/run-of-show/types";

/**
 * Insert a single vendor presence row into event_vendor_presence (migration
 * 049). Used by AddVendorSheet (generic-entry bottom sheet) AND
 * AddVendorPopup (phase-anchored popup) — both flows submit to this action.
 *
 * Validates phases against the 12-phase enum (matches the DB CHECK
 * constraint); rejects empty phase arrays (a presence with no phases is
 * semantically a contact record, not a presence record — DB schema
 * rejects it; this guard catches it before the round-trip).
 *
 * vendor_tenant_id is null for the "Define your own" path; populated when
 * the user picks from the Vndr roster (V-2b — placeholder in V-1).
 *
 * RLS-scoped client — migration 049's evp_insert policy uses
 * user_owns_event(event_id) so the authed user must own the event.
 */

export type AddVendorPresenceInput = {
  eventId: string;
  vendorTenantId?: string | null;
  vendorName: string;
  roleLabel?: string | null;
  phases: RoSPhase[];
  notes?: string | null;
};

export type AddVendorPresenceResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const VALID_PHASES = new Set<string>(PHASE_ORDER);

export async function addVendorPresence(
  input: AddVendorPresenceInput,
): Promise<AddVendorPresenceResult> {
  if (!input.eventId) return { ok: false, error: "Missing event." };
  const vendorName = input.vendorName.trim();
  if (!vendorName) return { ok: false, error: "Vndr name is required." };
  if (vendorName.length > 200) {
    return { ok: false, error: "Vndr name too long." };
  }
  if (!Array.isArray(input.phases) || input.phases.length === 0) {
    return { ok: false, error: "Select at least one phase." };
  }
  // Dedupe + validate every phase. Bad values rejected before the DB CHECK
  // fires so the user gets a clean error instead of a Postgres constraint
  // message.
  const seen = new Set<RoSPhase>();
  const cleanedPhases: RoSPhase[] = [];
  for (const p of input.phases) {
    if (!VALID_PHASES.has(p)) {
      return { ok: false, error: "Invalid phase selected." };
    }
    if (seen.has(p)) continue;
    seen.add(p);
    cleanedPhases.push(p);
  }

  const roleLabel = input.roleLabel?.trim() || null;
  if (roleLabel !== null && roleLabel.length > 100) {
    return { ok: false, error: "Role label too long." };
  }

  const notes = input.notes?.trim() || null;
  if (notes !== null && notes.length > 1000) {
    return { ok: false, error: "Notes too long." };
  }

  const vendorTenantId = input.vendorTenantId?.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("event_vendor_presence")
    .insert({
      event_id: input.eventId,
      vendor_tenant_id: vendorTenantId,
      vendor_name: vendorName,
      phases: cleanedPhases,
      role_label: roleLabel,
      notes: notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not add Vndr." };
  }

  revalidatePath("/orgnz");
  return { ok: true, id: data.id as string };
}
