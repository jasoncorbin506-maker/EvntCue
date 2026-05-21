"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CanvasPinLayout, CanvasState } from "../_lib/load-board";

export type SaveCanvasResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Mood Board Chunk A — persist the per-pin canvas layout.
 *
 * Per Lock 17 ("we persist whatever the client serializes"), per-pin
 * positions, rotations, and z-order live in `mood_boards.canvas_state`
 * (JSONB) — NOT as columns on `mood_board_pins`. Single board UPDATE
 * per drag-end instead of N pin updates.
 *
 * The client is the source of truth for layout shape; this action just
 * shallow-merges new pin layouts into the existing canvas_state.pins map.
 * Pins absent from the incoming payload keep whatever layout they had.
 */
export async function saveCanvasStateAction(args: {
  boardId: string;
  pins: Record<string, CanvasPinLayout>;
}): Promise<SaveCanvasResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!args.boardId) return { ok: false, error: "Missing board id." };
  if (!args.pins || typeof args.pins !== "object") {
    return { ok: false, error: "Missing pins payload." };
  }

  const admin = createAdminClient();

  // Ownership gate (defense in depth — mb_update RLS already covers this).
  const { data: board, error: boardErr } = await admin
    .from("mood_boards")
    .select("id, owner_id, canvas_state")
    .eq("id", args.boardId)
    .maybeSingle();
  if (boardErr) return { ok: false, error: `Board lookup failed: ${boardErr.message}` };
  if (!board) return { ok: false, error: "Board not found." };
  if (board.owner_id !== user.id) {
    return { ok: false, error: "You don't own this board." };
  }

  const existing = (board.canvas_state as CanvasState | null) ?? {};
  const merged: CanvasState = {
    ...existing,
    pins: {
      ...(existing.pins ?? {}),
      ...args.pins,
    },
  };

  const { error: updateErr } = await admin
    .from("mood_boards")
    .update({ canvas_state: merged })
    .eq("id", args.boardId);

  if (updateErr) return { ok: false, error: `Save failed: ${updateErr.message}` };

  return { ok: true };
}
