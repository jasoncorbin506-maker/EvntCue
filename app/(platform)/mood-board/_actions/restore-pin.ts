"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lock 22 — restore a soft-deleted pin by clearing deleted_at.
 *
 * Two entry points: the 8-second undo toast (immediately after a delete),
 * and the Recently Removed tray (any time within the 30-day window).
 *
 * Restore preserves the original layout via the existing canvas_state
 * entry (we don't strip canvas_state.pins[pinId] on delete, only the
 * pin row's deleted_at). If the canvas_state entry was lost for any
 * reason, the pin lands at the default position via load-board.ts.
 */

export type RestorePinResult = { ok: true } | { ok: false; error: string };

export async function restorePinAction(args: {
  pinId: string;
  boardId: string;
}): Promise<RestorePinResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!args.pinId) return { ok: false, error: "Missing pin id." };
  if (!args.boardId) return { ok: false, error: "Missing board id." };

  const admin = createAdminClient();

  const { data: board, error: boardErr } = await admin
    .from("mood_boards")
    .select("id, owner_id")
    .eq("id", args.boardId)
    .maybeSingle();
  if (boardErr) return { ok: false, error: `Board lookup failed: ${boardErr.message}` };
  if (!board) return { ok: false, error: "Board not found." };
  if (board.owner_id !== user.id) {
    return { ok: false, error: "You don't own this board." };
  }

  const { error: updateErr } = await admin
    .from("mood_board_pins")
    .update({ deleted_at: null })
    .eq("id", args.pinId)
    .eq("board_id", board.id)
    .not("deleted_at", "is", null);
  if (updateErr) return { ok: false, error: `Restore failed: ${updateErr.message}` };

  revalidatePath("/mood-board");
  return { ok: true };
}
