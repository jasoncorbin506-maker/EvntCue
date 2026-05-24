"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CanvasPinLayout,
  CanvasState,
  FabricSelection,
} from "../_lib/load-board";

export type SaveCanvasResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Mood Board Chunk B — persist canvas layout + fabric foundation + chip
 * selections. Extends the Chunk A version which only handled per-pin
 * positions.
 *
 * Per Lock 17 ("we persist whatever the client serializes"), the entire
 * canvas_state shape is the client's call. This action shallow-merges
 * each top-level field — fabric / chipSelections / pins — so partial
 * updates (e.g. just a drag-end with no fabric change) don't clobber
 * anything else.
 *
 * Pass `null` for fabric to explicitly clear it (return to corkboard).
 * Omit fabric from the args to leave the existing value alone.
 */
export async function saveCanvasStateAction(args: {
  boardId: string;
  /** Optional — omit to leave per-pin layouts unchanged. */
  pins?: Record<string, CanvasPinLayout>;
  /** Optional — undefined leaves existing fabric; null clears it. */
  fabric?: FabricSelection | null;
  /** Optional — partial chip-group selections to merge. */
  chipSelections?: {
    mood?: string[];
    material?: string[];
    florals?: string[];
    typography?: string[];
  };
}): Promise<SaveCanvasResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!args.boardId) return { ok: false, error: "Missing board id." };

  const admin = createAdminClient();

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

  // Pins: shallow-merge.
  const mergedPins =
    args.pins !== undefined
      ? { ...(existing.pins ?? {}), ...args.pins }
      : existing.pins;

  // Fabric: undefined = leave alone; null = clear; object = set.
  const mergedFabric =
    args.fabric === undefined ? existing.fabric ?? null : args.fabric;

  // Chip selections: shallow-merge per group.
  const existingChips = existing.chipSelections ?? {};
  const incomingChips = args.chipSelections ?? {};
  const mergedChipSelections = {
    mood: incomingChips.mood ?? existingChips.mood ?? [],
    material: incomingChips.material ?? existingChips.material ?? [],
    florals: incomingChips.florals ?? existingChips.florals ?? [],
    typography: incomingChips.typography ?? existingChips.typography ?? [],
  };

  const merged: CanvasState = {
    ...existing,
    pins: mergedPins,
    fabric: mergedFabric,
    chipSelections: mergedChipSelections,
  };

  const { error: updateErr } = await admin
    .from("mood_boards")
    .update({ canvas_state: merged })
    .eq("id", args.boardId);

  if (updateErr) return { ok: false, error: `Save failed: ${updateErr.message}` };

  return { ok: true };
}
