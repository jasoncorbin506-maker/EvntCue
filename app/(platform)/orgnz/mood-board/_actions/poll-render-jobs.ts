"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  pollRender,
  RenderError,
  type RenderOutcome,
} from "@/lib/render/RenderService";
import {
  fetchAndRehostImage,
  RehostError,
} from "@/lib/moodboard/pinterest-import";
import { SLOTS, type SlotKey } from "@/data/moodboard/slots";

/**
 * Mood Board Chunk D Step 3d — poll in-flight render jobs.
 *
 * Companion to start-render-job.ts. The UI fires this every 3s while any
 * slot in the rendered spread is in 'running' state with a provider_job_id
 * set. For each polled job:
 *   - succeeded → re-host the Replicate output, INSERT mood_board_pins,
 *     UPDATE render_jobs (status='complete', result_pin_id).
 *   - processing → leave the row alone (still cooking; UI keeps polling).
 *   - failed/canceled → UPDATE render_jobs (status='failed', failure_reason).
 *
 * Returns the current state of the polled jobs (same SlotResult shape as
 * startRenderJob). UI merges these into its slot state.
 *
 * The finalize-succeeded logic duplicates ~50 lines from start-render-job.ts.
 * Worth extracting to lib/moodboard/finalize-render.ts when the re-roll
 * action (3e) becomes the third caller — for now, duplication is cheaper
 * than the refactor risk before the render path has any UI callers proven.
 */

const PROMPT_TEMPLATE_ID = "lock21_v1";
const PROMPT_TEMPLATE_VERSION = 1;

export type PollRenderJobsInput = {
  boardId: string;
  renderJobIds: string[];
};

export type SlotResult =
  | {
      slot: SlotKey;
      status: "succeeded";
      renderJobId: string;
      pinId: string;
      signedUrl: string;
    }
  | {
      slot: SlotKey;
      status: "processing";
      renderJobId: string;
      providerJobId: string;
    }
  | {
      slot: SlotKey;
      status: "failed";
      renderJobId: string;
      reason: string;
    };

export type PollRenderJobsResult =
  | {
      ok: true;
      slots: SlotResult[];
    }
  | { ok: false; error: string };

export async function pollRenderJobs(
  input: PollRenderJobsInput,
): Promise<PollRenderJobsResult> {
  if (input.renderJobIds.length === 0) {
    return { ok: true, slots: [] };
  }

  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const admin = createAdminClient();

  // 2. Board ownership check (defense in depth)
  const { data: board, error: boardErr } = await admin
    .from("mood_boards")
    .select("id, tenant_id, owner_id")
    .eq("id", input.boardId)
    .maybeSingle();
  if (boardErr) {
    return { ok: false, error: `Board lookup failed: ${boardErr.message}` };
  }
  if (!board) return { ok: false, error: "Board not found." };
  if (board.owner_id !== user.id) {
    return { ok: false, error: "You don't own this board." };
  }

  // 3. Load the render_jobs rows the UI is asking about. Filter to this
  //    board so a leaked job ID from a different board can't be polled.
  const { data: jobs, error: jobsErr } = await admin
    .from("render_jobs")
    .select(
      "id, status, provider_job_id, slot_index, slot_values, board_id, completed_at",
    )
    .in("id", input.renderJobIds)
    .eq("board_id", input.boardId);
  if (jobsErr) {
    return {
      ok: false,
      error: `Render-jobs lookup failed: ${jobsErr.message}`,
    };
  }

  const slotResults: SlotResult[] = [];

  for (const job of jobs ?? []) {
    const slotValues = (job.slot_values ?? {}) as {
      slot_key?: SlotKey;
      prompt?: string;
      aspect_ratio?: string;
    };
    const slotKey = slotValues.slot_key;
    if (!slotKey || !(slotKey in SLOTS)) {
      // Schema drift — skip rather than fail the whole poll.
      continue;
    }

    const renderJobId = job.id as string;

    // Terminal states are returned as-is. UI may have already seen these,
    // but echoing them keeps the merge logic uniform.
    if (job.status === "complete") {
      // Look up the result pin to surface its current signed URL.
      const { data: pin } = await admin
        .from("mood_board_pins")
        .select("id, url")
        .eq("board_id", input.boardId)
        .eq("source", "render")
        .eq("slot_index", job.slot_index)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pin) {
        const signed = await admin.storage
          .from("mood-board-renders")
          .createSignedUrl(pin.url as string, 60 * 60);
        slotResults.push({
          slot: slotKey,
          status: "succeeded",
          renderJobId,
          pinId: pin.id as string,
          signedUrl: signed.data?.signedUrl ?? "",
        });
      }
      continue;
    }
    if (job.status === "failed" || job.status === "cancelled") {
      slotResults.push({
        slot: slotKey,
        status: "failed",
        renderJobId,
        reason: "Previously marked failed",
      });
      continue;
    }

    // Status is 'queued' or 'running'. Without a provider_job_id we can't
    // poll — caller should re-fire startRenderJob in that case.
    if (!job.provider_job_id) {
      slotResults.push({
        slot: slotKey,
        status: "processing",
        renderJobId,
        providerJobId: "",
      });
      continue;
    }

    // 4. Poll Replicate.
    let outcome: RenderOutcome;
    try {
      outcome = await pollRender(job.provider_job_id as string);
    } catch (err) {
      const reason =
        err instanceof RenderError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "Unknown poll error";
      await admin
        .from("render_jobs")
        .update({
          status: "failed",
          failure_reason: reason,
          completed_at: new Date().toISOString(),
        })
        .eq("id", renderJobId);
      slotResults.push({
        slot: slotKey,
        status: "failed",
        renderJobId,
        reason,
      });
      continue;
    }

    if (outcome.status === "processing") {
      slotResults.push({
        slot: slotKey,
        status: "processing",
        renderJobId,
        providerJobId: outcome.providerJobId,
      });
      continue;
    }

    // outcome.status === "succeeded" — finalize: re-host + pin INSERT +
    // render_jobs UPDATE. Mirrors the success path in start-render-job.ts.
    try {
      const rehosted = await fetchAndRehostImage({
        sourceUrl: outcome.imageUrl,
        tenantId: board.tenant_id as string,
        boardId: board.id as string,
        supabase: admin,
      });

      const { data: pin, error: pinErr } = await admin
        .from("mood_board_pins")
        .insert({
          board_id: board.id,
          source: "render",
          url: rehosted.storagePath,
          added_by: user.id,
          position: 0,
          slot_index: job.slot_index,
          prompt_template_id: PROMPT_TEMPLATE_ID,
          prompt_template_version: PROMPT_TEMPLATE_VERSION,
          prompt_snapshot: {
            prompt: slotValues.prompt ?? "",
            slot: slotKey,
            aspect_ratio: SLOTS[slotKey].aspectRatio,
            provider_job_id: outcome.providerJobId,
            replicate_started_at: outcome.startedAt,
            replicate_completed_at: outcome.completedAt,
            polled: true,
          },
          aspect_ratio: SLOTS[slotKey].aspectRatio,
          frame_subject_key: slotKey,
        })
        .select("id")
        .single();

      if (pinErr || !pin) {
        await admin.storage
          .from("mood-board-renders")
          .remove([rehosted.storagePath]);
        const reason = pinErr?.message ?? "Pin insert failed";
        await admin
          .from("render_jobs")
          .update({
            status: "failed",
            failure_reason: `Pin insert (polled): ${reason}`,
            completed_at: new Date().toISOString(),
          })
          .eq("id", renderJobId);
        slotResults.push({
          slot: slotKey,
          status: "failed",
          renderJobId,
          reason,
        });
        continue;
      }

      await admin
        .from("render_jobs")
        .update({
          status: "complete",
          result_pin_id: pin.id,
          completed_at:
            outcome.completedAt ?? new Date().toISOString(),
        })
        .eq("id", renderJobId);

      slotResults.push({
        slot: slotKey,
        status: "succeeded",
        renderJobId,
        pinId: pin.id as string,
        signedUrl: rehosted.signedUrl,
      });
    } catch (err) {
      const reason =
        err instanceof RehostError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "Re-host failed";
      await admin
        .from("render_jobs")
        .update({
          status: "failed",
          failure_reason: reason,
          completed_at: new Date().toISOString(),
        })
        .eq("id", renderJobId);
      slotResults.push({
        slot: slotKey,
        status: "failed",
        renderJobId,
        reason,
      });
    }
  }

  if (slotResults.some((r) => r.status === "succeeded" || r.status === "failed")) {
    revalidatePath("/orgnz/mood-board");
  }

  return { ok: true, slots: slotResults };
}
