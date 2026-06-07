/**
 * MediaService — the moderation ledger seam (a.k.a. "where the funnel plugs
 * into the DB").
 *
 * Design decision: the chokepoint does NOT take ownership of the domain rows
 * (vendor_photos, mood_board_pins, tenant_certifications, ...). Those keep
 * being written by each caller exactly as before. What the funnel adds is a
 * SEPARATE, central ledger keyed by (bucket, storage_path) that records, for
 * every byte that enters the system: who uploaded it, scan status, quarantine
 * flag, legal-hold flag, and the per-provider match records.
 *
 * Why a central ledger instead of a status column on each of the 6 domain
 * tables:
 *   - one place for the review queue, quarantine state, and legal-hold carve-out
 *     (deletion override) — these are cross-cutting, not per-feature;
 *   - the funnel is the ONLY writer, which is enforceable precisely because it's
 *     the only upload door;
 *   - adding a new media kind doesn't require a new moderation column anywhere.
 *
 * The backing tables (media_assets + media_scan_matches) are DRAFTED but NOT yet
 * applied (see deploy/ draft). Until they exist, the active store is a no-op, so
 * rerouting all upload paths through the funnel is strictly behavior-preserving.
 * When the migration is applied, swap in SupabaseModerationStore via
 * setModerationStore() and the ledger starts recording — no caller changes.
 */

import type { MediaKind, MediaVisibility, ScanVerdict } from "./types.ts";

export type ModerationRecord = {
  bucket: string;
  storagePath: string;
  kind: MediaKind;
  tenantId: string;
  uploadedBy: string;
  byteSize: number;
  contentType: string;
  visibility: MediaVisibility;
  verdict: ScanVerdict;
};

export interface ModerationStore {
  /**
   * Record an ingested object + its scan verdict. Called by the funnel after a
   * successful upload. MUST NOT throw in a way that fails the upload — a ledger
   * write problem is logged, not surfaced to the user mid-upload.
   */
  record(rec: ModerationRecord): Promise<void>;
}

/** Default: records nothing. Active until media_assets is applied. */
export class NoopModerationStore implements ModerationStore {
  async record(rec: ModerationRecord): Promise<void> {
    void rec; // intentional no-op — ledger tables not yet applied
  }
}

let activeStore: ModerationStore = new NoopModerationStore();

export function setModerationStore(store: ModerationStore): void {
  activeStore = store;
}

export function getModerationStore(): ModerationStore {
  return activeStore;
}
