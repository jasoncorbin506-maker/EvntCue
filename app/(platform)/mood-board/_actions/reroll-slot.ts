"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  runRender,
  RenderError,
  type RenderInput,
  type RenderOutcome,
  type AspectRatio,
} from "@/lib/render/RenderService";
import { finalizeRenderJob } from "@/lib/moodboard/finalize-render";
import { SLOTS, type SlotKey } from "@/data/moodboard/slots";

/**
 * Mood Board Chunk D Step 3e — per-slot re-roll.
 *
 * The tap-overlay action on a rendered photo: spawn a new render_jobs row
 * for the SAME slot with the SAME prompt (carried from parent pin's
 * prompt_snapshot per Lock 17 reproducibility), call runRender, finalize.
 *
 * On success: the previous pin is soft-deleted AFTER finalize lands the
 * new pin — per Lock 22 forgiveness, the user can restore the prior
 * version from Recently Removed within the 30-day window.
 *
 * Per Lock 21 limits:
 *   - 24h re-roll window from initial spread creation (carries forward on
 *     each re-roll; re-rolling a re-roll inherits the original window)
 *   - Hard cap 50 re-rolls per board (margin floor 75%)
 *
 * Both limits enforced here at the app layer (DB schema permits unbounded).
 *
 * No category re-resolution: the parent pin's prompt_snapshot is the source
 * of truth. v1 re-roll = same prompt, different seed (Replicate uses its
 * own seed on each call). Future enhancement: optional prompt-nudge UI.
 */

const LAYOUT_REROLL_CAP = 50;
const PROMPT_TEMPLATE_ID = "lock21_v1";
const PROMPT_TEMPLATE_VERSION = 1;

export type RerollSlotInput = {
  pinId: string;
};

export type RerollSlotResult =
  | {
      ok: true;
      status: "succeeded";
      renderJobId: string;
      pinId: string;
      signedUrl: string;
      remainingReRolls: number;
    }
  | {
      ok: true;
      status: "processing";
      renderJobId: string;
      providerJobId: string;
      remainingReRolls: number;
    }
  | { ok: false; error: string; code?: "window_closed" | "cap_reached" | "not_owner" | "not_render_pin" | "unknown" };

export async function rerollSlot(
  input: RerollSlotInput,
): Promise<RerollSlotResult> {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!input.pinId) return { ok: false, error: "Missing pin id." };

  const admin = createAdminClient();

  // 2. Load the parent pin — must be a render pin (source='render').
  const { data: parentPin, error: pinErr } = await admin
    .from("mood_board_pins")
    .select("id, board_id, source, slot_index, prompt_snapshot, frame_subject_key, deleted_at")
    .eq("id", input.pinId)
    .maybeSingle();
  if (pinErr) return { ok: false, error: `Pin lookup failed: ${pinErr.message}` };
  if (!parentPin) return { ok: false, error: "Pin not found." };
  if (parentPin.deleted_at) {
    return { ok: false, error: "Cannot re-roll a removed pin." };
  }
  if (parentPin.source !== "render") {
    return { ok: false, error: "Only rendered pins can be re-rolled.", code: "not_render_pin" };
  }

  const slotIndex = parentPin.slot_index as number | null;
  const slotKey = parentPin.frame_subject_key as SlotKey | null;
  if (slotIndex === null || !slotKey || !(slotKey in SLOTS)) {
    return { ok: false, error: "Pin is missing slot metadata." };
  }

  const snapshot = (parentPin.prompt_snapshot ?? {}) as {
    prompt?: string;
    aspect_ratio?: string;
  };
  const prompt = snapshot.prompt;
  if (!prompt) return { ok: false, error: "Pin is missing a prompt snapshot." };

  // 3. Board ownership check.
  const { data: board, error: boardErr } = await admin
    .from("mood_boards")
    .select("id, tenant_id, owner_id")
    .eq("id", parentPin.board_id)
    .maybeSingle();
  if (boardErr) return { ok: false, error: `Board lookup failed: ${boardErr.message}` };
  if (!board) return { ok: false, error: "Board not found." };
  if (board.owner_id !== user.id) {
    return { ok: false, error: "You don't own this board.", code: "not_owner" };
  }

  // 4. Find the parent render_jobs row to read re_roll_window_ends_at.
  //    A re-roll inherits the ORIGINAL spread's window — re-rolling at hour
  //    23 still gets you a window-aware reply (not a fresh 24h).
  const { data: parentJob, error: parentJobErr } = await admin
    .from("render_jobs")
    .select("re_roll_window_ends_at")
    .eq("result_pin_id", input.pinId)
    .maybeSingle();
  if (parentJobErr) {
    return { ok: false, error: `Parent job lookup failed: ${parentJobErr.message}` };
  }

  const windowEndsAt = parentJob?.re_roll_window_ends_at as string | null | undefined;
  if (!windowEndsAt) {
    return { ok: false, error: "Could not resolve re-roll window for this pin." };
  }
  if (new Date(windowEndsAt) <= new Date()) {
    return {
      ok: false,
      error: "Re-roll window closed (24 hours from initial spread).",
      code: "window_closed",
    };
  }

  // 5. Enforce 50-per-board cap. Counts every render_jobs row for this board
  //    that has a parent_pin_id (i.e., is a re-roll), regardless of status —
  //    failed re-rolls still consumed a budget slot.
  const { count: existingRerolls, error: countErr } = await admin
    .from("render_jobs")
    .select("id", { count: "exact", head: true })
    .eq("board_id", board.id)
    .not("parent_pin_id", "is", null);
  if (countErr) {
    return { ok: false, error: `Re-roll cap check failed: ${countErr.message}` };
  }
  const consumed = existingRerolls ?? 0;
  if (consumed >= LAYOUT_REROLL_CAP) {
    return {
      ok: false,
      error: `Re-roll cap reached (${LAYOUT_REROLL_CAP} per spread).`,
      code: "cap_reached",
    };
  }
  const remainingBefore = LAYOUT_REROLL_CAP - consumed;

  // 6. INSERT the new render_jobs row. Carry parent's window so re-rolls of
  //    re-rolls inherit the original timestamp.
  const aspectRatio = SLOTS[slotKey].aspectRatio satisfies AspectRatio;
  const { data: newJob, error: insertErr } = await admin
    .from("render_jobs")
    .insert({
      board_id: board.id,
      requested_by: user.id,
      layout_kind: "editorial_10",
      template_id: PROMPT_TEMPLATE_ID,
      template_version: PROMPT_TEMPLATE_VERSION,
      slot_values: {
        slot_key: slotKey,
        prompt,
        aspect_ratio: aspectRatio,
      },
      slot_index: slotIndex,
      status: "queued",
      re_roll_count: 1,
      re_roll_window_ends_at: windowEndsAt,
      parent_pin_id: parentPin.id,
    })
    .select("id")
    .single();
  if (insertErr || !newJob) {
    return {
      ok: false,
      error: `Could not queue re-roll: ${insertErr?.message ?? "no row"}`,
    };
  }
  const renderJobId = newJob.id as string;

  // 7. Mark running + fire the provider call.
  await admin
    .from("render_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", renderJobId);

  const renderInput: RenderInput = {
    prompt,
    aspectRatio,
    outputFormat: "webp",
  };

  let outcome: RenderOutcome;
  try {
    outcome = await runRender(renderInput);
  } catch (err) {
    const reason =
      err instanceof RenderError
        ? `${err.code}: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown render error";
    await admin
      .from("render_jobs")
      .update({
        status: "failed",
        failure_reason: reason,
        completed_at: new Date().toISOString(),
      })
      .eq("id", renderJobId);
    return { ok: false, error: reason };
  }

  // 8. Processing (Replicate hasn't finished): return early, UI polls.
  //    Old pin stays visible until poll-render-jobs resolves the new one
  //    successfully — then poll path soft-deletes via the same mechanism
  //    (TODO: poll path doesn't yet know to soft-delete the parent; for v1
  //    we accept that re-rolls landing via the poll path leave the parent
  //    pin live until the user manually removes it. Documented as follow-up.)
  if (outcome.status === "processing") {
    await admin
      .from("render_jobs")
      .update({ provider_job_id: outcome.providerJobId })
      .eq("id", renderJobId);
    return {
      ok: true,
      status: "processing",
      renderJobId,
      providerJobId: outcome.providerJobId,
      remainingReRolls: remainingBefore - 1,
    };
  }

  // 9. Synchronous success — finalize + soft-delete parent.
  const finalized = await finalizeRenderJob({
    admin,
    board: { id: board.id as string, tenant_id: board.tenant_id as string },
    userId: user.id,
    renderJobId,
    slotKey,
    slotIndex,
    prompt,
    outcome,
    parentPinId: parentPin.id as string,
    snapshotExtras: { reroll: true },
  });

  if (!finalized.ok) {
    return { ok: false, error: finalized.reason };
  }

  // Per Lock 22 forgiveness: soft-delete the parent AFTER the new pin lands.
  // The slot never goes empty mid-flight, and the user can restore the
  // previous version from Recently Removed (30-day window).
  await admin
    .from("mood_board_pins")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parentPin.id);

  revalidatePath("/mood-board");

  return {
    ok: true,
    status: "succeeded",
    renderJobId,
    pinId: finalized.pinId,
    signedUrl: finalized.signedUrl,
    remainingReRolls: remainingBefore - 1,
  };
}
