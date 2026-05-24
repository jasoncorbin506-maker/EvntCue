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
import { assemblePrompt } from "@/lib/render/prompt-assembler";
import {
  SLOT_ORDER,
  SLOTS,
  PHOTOGRAPHY_BY_CATEGORY,
  compositionForSlot,
  type SlotKey,
} from "@/data/moodboard/slots";
import { byCategory } from "@/data/moodboard";
import {
  serializeBoard,
  type BoardWithPins,
  type LoadedPinForSnapshot,
} from "@/lib/moodboard/board-snapshot";
import { finalizeRenderJob } from "@/lib/moodboard/finalize-render";
import { mapEventTypeToCategory } from "@/lib/labels/event-category";
import type { EventCategory } from "@/data/moodboard/types";

/**
 * Mood Board Chunk D Step 3c — start a 10-slot AI render spread.
 *
 * Orchestrates: board ownership → event-category resolution → board
 * snapshot → 10 prompt assemblies → 10 parallel Replicate calls → re-host
 * successes → INSERT render-pin rows → UPDATE render_jobs rows.
 *
 * Pre-Phase-4 the action is ungated in dev — same isPaidTier-flip pattern
 * as the Chunk A surface. Stripe Connect plumbing for the $9.99 one-time
 * charge lands with Phase 4.
 *
 * Polling story: when a slot returns { status: "processing" } the
 * render_jobs row is left in status='running' with provider_job_id set.
 * UI step (3d) writes the polling action that resolves these. v1 ships
 * the start without polling — slow slots will surface in the UI as
 * "still cooking" placeholders until the polling action lands.
 *
 * REPLICATE_API_TOKEN must be present in .env.local (local) or Vercel
 * Production env (deployed) before any real render can fire. Without it
 * the RenderService throws a typed missing_token error which this action
 * surfaces as { ok: false, error }.
 */

const LAYOUT_KIND = "editorial_10";
const PROMPT_TEMPLATE_ID = "lock21_v1";
const PROMPT_TEMPLATE_VERSION = 1;
const RE_ROLL_WINDOW_HOURS = 24;

export type StartRenderInput = {
  boardId: string;
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

export type StartRenderResult =
  | {
      ok: true;
      slots: SlotResult[];
      succeeded: number;
      processing: number;
      failed: number;
    }
  | { ok: false; error: string };

export async function startRenderJob(
  input: StartRenderInput,
): Promise<StartRenderResult> {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const admin = createAdminClient();

  // 2. Board ownership + canvas_state load
  const { data: board, error: boardErr } = await admin
    .from("mood_boards")
    .select("id, tenant_id, owner_id, event_id, canvas_state")
    .eq("id", input.boardId)
    .maybeSingle();
  if (boardErr) {
    return { ok: false, error: `Board lookup failed: ${boardErr.message}` };
  }
  if (!board) return { ok: false, error: "Board not found." };
  if (board.owner_id !== user.id) {
    return { ok: false, error: "You don't own this board." };
  }

  // 3. Resolve event category + subtype from linked event (if any).
  // v1: simple event_type → EventCategory map. Polish-pass: move to a
  // shared lib/labels/event-category.ts module so other render-like
  // surfaces can reuse it.
  let eventCategory: EventCategory = "wedding";
  let eventSubtype: string | null = null;
  if (board.event_id) {
    const { data: event } = await admin
      .from("events")
      .select("event_type, event_subtype")
      .eq("id", board.event_id)
      .maybeSingle();
    if (event) {
      eventCategory = mapEventTypeToCategory(event.event_type as string);
      eventSubtype = (event.event_subtype as string | null) ?? null;
    }
  }

  // 4. Load pins for the board snapshot.
  const { data: pins, error: pinsErr } = await admin
    .from("mood_board_pins")
    .select("id, source, tags, url")
    .eq("board_id", input.boardId)
    .is("deleted_at", null);
  if (pinsErr) {
    return { ok: false, error: `Pins lookup failed: ${pinsErr.message}` };
  }

  const pinsForSnapshot: LoadedPinForSnapshot[] = (pins ?? []).map((p) => {
    const tags = (p.tags as string[] | null) ?? [];
    const source = p.source as LoadedPinForSnapshot["source"];
    return {
      pinId: p.id as string,
      source,
      chipKey: source === "chip" ? tags[0] : undefined,
      imagePath:
        source === "upload" || source === "render"
          ? (p.url as string)
          : undefined,
      slotTags: tags,
      // canvas_state owns position; snapshot serializer tolerates default.
      position: { x: 0, y: 0, rotation: 0 },
    };
  });

  const boardWithPins: BoardWithPins = {
    boardId: board.id as string,
    eventCategory,
    eventSubtype,
    canvasState:
      (board.canvas_state as BoardWithPins["canvasState"]) ?? {},
    pins: pinsForSnapshot,
  };
  const snapshot = serializeBoard(boardWithPins);
  const catalog = byCategory(snapshot.eventCategory);

  // 5. Pre-compute prompts (so we INSERT the snapshot atomically with the
  //    render_jobs row — important for re-roll reproducibility per Lock 17).
  const reRollWindowEndsAt = new Date(
    Date.now() + RE_ROLL_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const slotPlan = SLOT_ORDER.map((slotKey, idx) => {
    const prompt = assemblePrompt({
      snapshot,
      photography: PHOTOGRAPHY_BY_CATEGORY[eventCategory],
      composition: compositionForSlot(eventCategory, slotKey),
      catalog,
    });
    const aspectRatio = SLOTS[slotKey].aspectRatio satisfies AspectRatio;
    return { slotKey, slotIndex: idx, prompt, aspectRatio };
  });

  // 6. INSERT 10 render_jobs rows (status='queued' — moved to 'running'
  //    or final status individually as each Replicate call resolves).
  const jobInserts = slotPlan.map((p) => ({
    board_id: board.id,
    requested_by: user.id,
    layout_kind: LAYOUT_KIND,
    template_id: PROMPT_TEMPLATE_ID,
    template_version: PROMPT_TEMPLATE_VERSION,
    slot_values: {
      slot_key: p.slotKey,
      prompt: p.prompt,
      aspect_ratio: p.aspectRatio,
    },
    slot_index: p.slotIndex,
    status: "queued" as const,
    re_roll_window_ends_at: reRollWindowEndsAt,
  }));

  const { data: insertedJobs, error: insertErr } = await admin
    .from("render_jobs")
    .insert(jobInserts)
    .select("id, slot_index");
  if (insertErr || !insertedJobs) {
    return {
      ok: false,
      error: `Could not queue renders: ${insertErr?.message ?? "no rows returned"}`,
    };
  }

  const jobIdBySlotIndex = new Map<number, string>();
  for (const row of insertedJobs) {
    jobIdBySlotIndex.set(row.slot_index as number, row.id as string);
  }

  // 7. Promise.allSettled — 10 parallel runRender calls. Each branch
  //    catches its own RenderError so allSettled's outer rejection path
  //    is effectively never taken (defensive handling anyway).
  type SlotExecution =
    | {
        slotKey: SlotKey;
        slotIndex: number;
        renderJobId: string;
        prompt: string;
        outcome: RenderOutcome;
      }
    | {
        slotKey: SlotKey;
        slotIndex: number;
        renderJobId: string;
        prompt: string;
        error: unknown;
      };

  const executions: SlotExecution[] = await Promise.all(
    slotPlan.map(async (p): Promise<SlotExecution> => {
      const renderJobId = jobIdBySlotIndex.get(p.slotIndex)!;
      const renderInput: RenderInput = {
        prompt: p.prompt,
        aspectRatio: p.aspectRatio,
        outputFormat: "webp",
      };
      // Mark as running just before firing. One UPDATE per slot keeps
      // started_at honest if anything later in the chain fails mid-flight.
      await admin
        .from("render_jobs")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", renderJobId);
      try {
        const outcome = await runRender(renderInput);
        return {
          slotKey: p.slotKey,
          slotIndex: p.slotIndex,
          renderJobId,
          prompt: p.prompt,
          outcome,
        };
      } catch (error) {
        return {
          slotKey: p.slotKey,
          slotIndex: p.slotIndex,
          renderJobId,
          prompt: p.prompt,
          error,
        };
      }
    }),
  );

  // 8. Resolve each execution: re-host succeeded, mark processing/failed.
  const results: SlotResult[] = [];
  for (const exec of executions) {
    if ("error" in exec) {
      const reason =
        exec.error instanceof RenderError
          ? `${exec.error.code}: ${exec.error.message}`
          : exec.error instanceof Error
            ? exec.error.message
            : "Unknown render error";
      await admin
        .from("render_jobs")
        .update({
          status: "failed",
          failure_reason: reason,
          completed_at: new Date().toISOString(),
        })
        .eq("id", exec.renderJobId);
      results.push({
        slot: exec.slotKey,
        status: "failed",
        renderJobId: exec.renderJobId,
        reason,
      });
      continue;
    }

    if (exec.outcome.status === "processing") {
      await admin
        .from("render_jobs")
        .update({ provider_job_id: exec.outcome.providerJobId })
        .eq("id", exec.renderJobId);
      results.push({
        slot: exec.slotKey,
        status: "processing",
        renderJobId: exec.renderJobId,
        providerJobId: exec.outcome.providerJobId,
      });
      continue;
    }

    // outcome.status === "succeeded" — delegate to the shared finalize helper.
    // Carry provider_job_id over manually since start-render-job recorded it
    // separately for the processing branch; finalize will set status='complete'
    // + result_pin_id + completed_at.
    await admin
      .from("render_jobs")
      .update({ provider_job_id: exec.outcome.providerJobId })
      .eq("id", exec.renderJobId);

    const finalized = await finalizeRenderJob({
      admin,
      board: { id: board.id as string, tenant_id: board.tenant_id as string },
      userId: user.id,
      renderJobId: exec.renderJobId,
      slotKey: exec.slotKey,
      slotIndex: exec.slotIndex,
      prompt: exec.prompt,
      outcome: exec.outcome,
    });

    if (finalized.ok) {
      results.push({
        slot: exec.slotKey,
        status: "succeeded",
        renderJobId: exec.renderJobId,
        pinId: finalized.pinId,
        signedUrl: finalized.signedUrl,
      });
    } else {
      results.push({
        slot: exec.slotKey,
        status: "failed",
        renderJobId: exec.renderJobId,
        reason: finalized.reason,
      });
    }
  }

  revalidatePath("/mood-board");

  return {
    ok: true,
    slots: results,
    succeeded: results.filter((r) => r.status === "succeeded").length,
    processing: results.filter((r) => r.status === "processing").length,
    failed: results.filter((r) => r.status === "failed").length,
  };
}

// mapEventTypeToCategory moved to lib/labels/event-category.ts per Lock 15
// (single source of truth for DB enum → display/category translation). The
// re-roll path (Step 3e) reuses the parent pin's prompt_snapshot so it
// doesn't need the mapping; the vendor-brief surface (Lock 18 §47 Upgrade 2)
// will be the next caller when that lands.
