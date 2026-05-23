import type { SupabaseClient } from "@supabase/supabase-js";
import { SLOTS, type SlotKey } from "@/data/moodboard/slots";
import {
  fetchAndRehostImage,
  RehostError,
} from "@/lib/moodboard/pinterest-import";
import type { RenderSuccess } from "@/lib/render/RenderService";

/**
 * Mood Board Chunk D — finalize a succeeded render outcome.
 *
 * Extracts the "succeeded → re-host + INSERT mood_board_pins + UPDATE
 * render_jobs to complete" block previously duplicated across:
 *   - start-render-job.ts (Step 3c — initial 10-slot spread)
 *   - poll-render-jobs.ts (Step 3d — poll resolves slow Replicate slots)
 *   - reroll-slot.ts      (Step 3e — per-slot re-roll)
 *
 * Per Lock 17 (RenderService abstraction): finalize is provider-agnostic.
 * The `RenderSuccess` shape is the boundary — finalize doesn't care if
 * the bytes came from Replicate or fal.ai.
 *
 * Per Lock 18 (image sourcing): we re-host every successful render to
 * private Supabase Storage; the caller never hot-links the provider CDN.
 *
 * Per Lock 21 (re-roll lineage): a re-roll passes `parentPinId` so the new
 * pin row carries the lineage. v1 pin schema doesn't have a parent_pin_id
 * column on mood_board_pins — the lineage lives on render_jobs.parent_pin_id
 * (set by the caller before invoking finalize). Per Lock 22 (forgiveness),
 * the caller handles soft-deleting the previous pin AFTER finalize succeeds
 * so the slot never goes empty mid-flight.
 *
 * Failure modes:
 *   - re-host throws RehostError → render_jobs marked failed, storage
 *     untouched (no upload happened), result returns { ok: false, ... }
 *   - pin INSERT fails → just-uploaded storage object is removed (best-
 *     effort), render_jobs marked failed, result returns { ok: false, ... }
 *
 * Returns the new pin id + signed URL so the caller can echo to the UI.
 */

const PROMPT_TEMPLATE_ID = "lock21_v1";
const PROMPT_TEMPLATE_VERSION = 1;

export type FinalizeInput = {
  /** Admin / service-role client; finalize bypasses RLS by design (called from server actions that already authed). */
  admin: SupabaseClient;
  /** Board taking the new pin. tenant_id needed for the re-host storage path. */
  board: { id: string; tenant_id: string };
  /** Authed user id — used as `mood_board_pins.added_by`. */
  userId: string;
  /** render_jobs row to mark complete + link result_pin_id. */
  renderJobId: string;
  /** Slot the render belongs to. */
  slotKey: SlotKey;
  /** Slot index in the spread (0..9 for editorial_10). */
  slotIndex: number;
  /** The prompt that produced this render — snapshotted on the pin for re-roll reproducibility. */
  prompt: string;
  /** Successful Replicate (or other provider) outcome. */
  outcome: RenderSuccess;
  /** Optional — set for re-roll calls; null/undefined for initial spread. */
  parentPinId?: string | null;
  /** Optional snapshot extras the caller wants to carry into prompt_snapshot. */
  snapshotExtras?: Record<string, unknown>;
};

export type FinalizeResult =
  | { ok: true; pinId: string; signedUrl: string }
  | { ok: false; reason: string };

export async function finalizeRenderJob(
  input: FinalizeInput,
): Promise<FinalizeResult> {
  const { admin, board, userId, renderJobId, slotKey, slotIndex, prompt, outcome } =
    input;

  // 1. Re-host the provider's image to our private bucket.
  let rehosted: { storagePath: string; signedUrl: string };
  try {
    rehosted = await fetchAndRehostImage({
      sourceUrl: outcome.imageUrl,
      tenantId: board.tenant_id,
      boardId: board.id,
      supabase: admin,
    });
  } catch (err) {
    const reason =
      err instanceof RehostError
        ? `${err.code}: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Re-host failed";
    await markJobFailed(admin, renderJobId, reason);
    return { ok: false, reason };
  }

  // 2. INSERT the mood_board_pins row.
  const snapshot: Record<string, unknown> = {
    prompt,
    slot: slotKey,
    aspect_ratio: SLOTS[slotKey].aspectRatio,
    provider_job_id: outcome.providerJobId,
    replicate_started_at: outcome.startedAt,
    replicate_completed_at: outcome.completedAt,
    ...(input.snapshotExtras ?? {}),
  };
  if (input.parentPinId) snapshot.parent_pin_id = input.parentPinId;

  const { data: pin, error: pinErr } = await admin
    .from("mood_board_pins")
    .insert({
      board_id: board.id,
      source: "render",
      url: rehosted.storagePath,
      added_by: userId,
      position: 0,
      slot_index: slotIndex,
      prompt_template_id: PROMPT_TEMPLATE_ID,
      prompt_template_version: PROMPT_TEMPLATE_VERSION,
      prompt_snapshot: snapshot,
      aspect_ratio: SLOTS[slotKey].aspectRatio,
      frame_subject_key: slotKey,
    })
    .select("id")
    .single();

  if (pinErr || !pin) {
    // Pin INSERT failed AFTER the upload landed — clean the orphan object.
    await admin.storage.from("mood-board-renders").remove([rehosted.storagePath]);
    const reason = pinErr?.message ?? "Pin insert failed";
    await markJobFailed(admin, renderJobId, `Pin insert: ${reason}`);
    return { ok: false, reason };
  }

  // 3. Mark the render_jobs row complete + link result_pin_id.
  await admin
    .from("render_jobs")
    .update({
      status: "complete",
      result_pin_id: pin.id,
      completed_at: outcome.completedAt ?? new Date().toISOString(),
    })
    .eq("id", renderJobId);

  return {
    ok: true,
    pinId: pin.id as string,
    signedUrl: rehosted.signedUrl,
  };
}

async function markJobFailed(
  admin: SupabaseClient,
  renderJobId: string,
  reason: string,
): Promise<void> {
  await admin
    .from("render_jobs")
    .update({
      status: "failed",
      failure_reason: reason,
      completed_at: new Date().toISOString(),
    })
    .eq("id", renderJobId);
}
