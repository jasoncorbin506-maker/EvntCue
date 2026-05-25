/**
 * Vendor presence — server-side admin read. Concept C primitive per
 * Cowork's vendor-task-model design brief
 * (`inbox-cc/processed/2026-05-24-vendor-task-model-design.md`).
 *
 * Vendor presence represents "vendor X is active during these RoS phases of
 * event Y" — a track that runs across phases, structurally distinct from a
 * milestone (which is a moment IN a phase). Schema in migration 049.
 *
 * Types + client-safe utilities (sortPresences / presencesInPhase /
 * presenceInitial / presenceDisplayName) live in
 * `lib/events/vendor-presence-shared.ts` so the 4 orgnz Vendor* client
 * components can import them without dragging `server-only` into the
 * client bundle (V-2b smoke-fix session 23 — Next.js 16 strict
 * server-only check broke the Vercel build until the split).
 * Re-exported below for back-compat with server-side callers.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VendorPresence } from "@/lib/events/vendor-presence-shared";

export type { VendorPresence } from "@/lib/events/vendor-presence-shared";
export {
  sortPresences,
  presencesInPhase,
  presenceInitial,
  presenceDisplayName,
} from "@/lib/events/vendor-presence-shared";

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
