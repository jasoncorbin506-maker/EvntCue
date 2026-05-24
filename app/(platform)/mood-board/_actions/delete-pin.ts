"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lock 22 — soft-delete a pin by stamping deleted_at.
 *
 * Reads filter WHERE deleted_at IS NULL (in load-board.ts), so a soft-deleted
 * pin disappears from the canvas immediately. Recovery within 30 days via
 * restore-pin.ts (Recently Removed tray) or the 8-second undo toast.
 *
 * After 30 days, a separate cleanup job hard-deletes the row + cleans the
 * Storage object for upload/render pins. Cleanup mechanism designed at
 * implementation time per the Lock 22 spec.
 */

export type DeletePinResult = { ok: true } | { ok: false; error: string };

export async function deletePinAction(args: {
  pinId: string;
  boardId: string;
}): Promise<DeletePinResult> {
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
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", args.pinId)
    .eq("board_id", board.id)
    .is("deleted_at", null);
  if (updateErr) return { ok: false, error: `Delete failed: ${updateErr.message}` };

  revalidatePath("/mood-board");
  return { ok: true };
}
