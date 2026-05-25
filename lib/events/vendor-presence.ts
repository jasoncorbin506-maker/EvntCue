/**
 * Vendor presence — Concept C primitive per Cowork's vendor-task-model
 * design brief (`inbox-cc/processed/2026-05-24-vendor-task-model-design.md`).
 *
 * Vendor presence represents "vendor X is active during these RoS phases of
 * event Y" — a track that runs across phases, structurally distinct from a
 * milestone (which is a moment IN a phase). Schema in migration 049.
 *
 * Session A (commit `cca85d6`) shipped the schema. Session B (this code +
 * the Vendor* components) ships the visual + interactive surfaces per
 * Cowork's v2-vertical brief.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RoSPhase } from "@/data/run-of-show/types";

export type VendorPresence = {
  id: string;
  event_id: string;
  vendor_tenant_id: string | null;
  vendor_name: string;
  /** Validated against the 12-phase CHECK constraint at write time. */
  phases: RoSPhase[];
  role_label: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/**
 * Fetch all vendor presence rows for an event. Caller is expected to be a
 * server component already gated on event ownership (load-context.ts gates
 * by tenantId; this function trusts that gate). Uses the admin client to
 * bypass RLS since the surrounding read path is already authorized.
 *
 * Returns an empty array when the table doesn't exist yet (pre-migration-049
 * graceful no-op — matches the pattern in load-context.ts for the migration-
 * 048 enrichment query).
 */
export async function getEventVendorPresence(
  eventId: string,
): Promise<VendorPresence[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("event_vendor_presence")
    .select(
      "id, event_id, vendor_tenant_id, vendor_name, phases, role_label, notes, created_by, created_at, updated_at",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    // Graceful no-op: pre-migration-049 schemas don't have this table.
    // Without this we'd 500 every dashboard load.
    return [];
  }
  return (data ?? []) as VendorPresence[];
}

/**
 * Sort presences by earliest-phase-covered ascending, then by role_label
 * (alphabetical) → vendor_name (alphabetical) as tiebreakers. Used by the
 * top VendorsAtEventSection cast list AND each phase's VendorPresenceDots
 * row (so visual order is consistent across both surfaces).
 *
 * The "earliest phase" is the lowest index in PHASE_ORDER among the
 * presence's phases array — not the array's first element (which is
 * insertion order, not phase order).
 */
export function sortPresences(
  presences: VendorPresence[],
  phaseOrder: readonly RoSPhase[],
): VendorPresence[] {
  const phaseIndex = new Map<RoSPhase, number>(
    phaseOrder.map((p, i) => [p, i]),
  );

  return [...presences].sort((a, b) => {
    const aMin = Math.min(
      ...a.phases.map((p) => phaseIndex.get(p) ?? Number.POSITIVE_INFINITY),
    );
    const bMin = Math.min(
      ...b.phases.map((p) => phaseIndex.get(p) ?? Number.POSITIVE_INFINITY),
    );
    if (aMin !== bMin) return aMin - bMin;

    const aLabel = (a.role_label ?? "").toLowerCase();
    const bLabel = (b.role_label ?? "").toLowerCase();
    if (aLabel !== bLabel) return aLabel.localeCompare(bLabel);

    return a.vendor_name.toLowerCase().localeCompare(b.vendor_name.toLowerCase());
  });
}

/**
 * Filter presences down to those covering a specific phase. Used by each
 * phase group's VendorPresenceDots footer.
 */
export function presencesInPhase(
  presences: VendorPresence[],
  phase: RoSPhase,
): VendorPresence[] {
  return presences.filter((p) => p.phases.includes(phase));
}

/**
 * Derive a vendor's display initial for the dot circle. Prefers the first
 * letter of role_label (when set — "P" for "photographer" is clearer than
 * "M" for "Marigold Photography"); falls back to vendor_name. Always
 * uppercase, single character.
 */
export function presenceInitial(presence: VendorPresence): string {
  const source = (presence.role_label ?? presence.vendor_name).trim();
  return source.charAt(0).toUpperCase() || "·";
}

/**
 * Display name for the cast list + detail sheet headline. Role label
 * leads (primary line); vendor_name is the secondary line when both are
 * set. When only one is set, that one is the headline.
 */
export function presenceDisplayName(presence: VendorPresence): {
  primary: string;
  secondary: string | null;
} {
  const role = presence.role_label?.trim() ?? "";
  const name = presence.vendor_name.trim();
  if (role && name && role.toLowerCase() !== name.toLowerCase()) {
    return { primary: role, secondary: name };
  }
  return { primary: role || name, secondary: null };
}
