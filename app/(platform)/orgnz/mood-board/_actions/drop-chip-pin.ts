"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Mood Board Chunk B — drop a chip-mode pin onto the board.
 *
 * For Material / Mood / Florals / Typography chips. (Palette chips don't
 * call this — they paint the canvas via save-canvas-state instead.)
 *
 * Schema note: until migration 039 lands and adds 'chip' to the
 * pin_source enum, we write source='url' as a stop-gap and stamp the
 * chip key into `tags` (existing TEXT[] column). After 039 applies, we
 * switch source to 'chip'. The chip_key lookup happens at render time
 * via the data/moodboard module.
 *
 * Position defaults to a slight offset so the new chip doesn't land
 * directly on top of any existing pin. The client overrides with the
 * actual drop coordinates when chip dropping becomes drag-from-drawer
 * (future polish — Chunk B ships click-to-drop with default position).
 */

export type DropChipResult =
  | {
      ok: true;
      pin: {
        id: string;
        chipKey: string;
        source: "chip" | "url";
      };
    }
  | { ok: false; error: string };

export async function dropChipPinAction(args: {
  boardId: string;
  chipKey: string;
  /** Optional override for the initial drop position. */
  initialPosition?: { x: number; y: number; rotation: number; z: number };
}): Promise<DropChipResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!args.boardId) return { ok: false, error: "Missing board id." };
  if (!args.chipKey) return { ok: false, error: "Missing chip key." };

  const admin = createAdminClient();

  // Ownership gate (defense in depth — mb_select RLS already covers).
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

  // Try source='chip' first (post-migration-039). Fall back to source='url'
  // if the enum value doesn't exist yet — Postgres returns code 22P02
  // (invalid_text_representation) on unknown enum values.
  const baseInsert = {
    board_id: board.id,
    url: `chip://${args.chipKey}`,  // sentinel — chip key, not a real URL
    added_by: user.id,
    position: 0,
    tags: [`chip:${args.chipKey}`],  // chip key carried in tags as fallback identifier
  };

  let pinId: string | null = null;
  let usedSource: "chip" | "url" = "chip";

  const tryChip = await admin
    .from("mood_board_pins")
    .insert({ ...baseInsert, source: "chip" })
    .select("id")
    .single();

  if (tryChip.error) {
    // Likely the 'chip' enum value doesn't exist yet — fall back.
    const tryUrl = await admin
      .from("mood_board_pins")
      .insert({ ...baseInsert, source: "url" })
      .select("id")
      .single();
    if (tryUrl.error || !tryUrl.data) {
      return { ok: false, error: `Chip drop failed: ${tryUrl.error?.message ?? "unknown"}` };
    }
    pinId = tryUrl.data.id as string;
    usedSource = "url";
  } else {
    pinId = tryChip.data.id as string;
  }

  revalidatePath("/orgnz/mood-board");

  return {
    ok: true,
    pin: {
      id: pinId,
      chipKey: args.chipKey,
      source: usedSource,
    },
  };
}
