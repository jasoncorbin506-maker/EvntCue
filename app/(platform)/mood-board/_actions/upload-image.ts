"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestBytes, extForMime, removeObjects } from "@/lib/media";
import {
  moodBoardPhotoCap,
  countBoardPhotos,
  photoCapMessage,
} from "@/lib/moodboard/photo-cap";

export type UploadResult =
  | {
      ok: true;
      pin: {
        id: string;
        image_path: string;
        signed_url: string;
        source: "upload";
      };
    }
  | { ok: false; error: string };

/**
 * Mood Board Chunk A — receive a File from the client and funnel it through
 * MediaService (the CSAM-safety chokepoint): validation (10 MB; jpeg/png/webp/
 * heic), future scan, upload to the private `mood-board-renders` bucket, and a
 * 1h signed URL. This action keeps board-ownership defense, the mood_board_pins
 * INSERT (provenance via added_by), and cleanup-on-insert-failure.
 *
 * Path convention preserved: `${tenant_id}/${board_id}/${randomUUID()}.${ext}`.
 */
export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("file");
  const boardId = String(formData.get("board_id") ?? "");
  // Chunk B (B-4) — optional slot tag written into mood_board_pins.tags
  // when the user clicked a Suggested Upload chip.
  const slotTag = (formData.get("slot_tag") as string | null) || null;
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  if (!boardId) return { ok: false, error: "Missing board id." };

  const admin = createAdminClient();

  // Confirm the user owns this board before letting them upload to it.
  const { data: board, error: boardErr } = await admin
    .from("mood_boards")
    .select("id, tenant_id, owner_id")
    .eq("id", boardId)
    .maybeSingle();
  if (boardErr) return { ok: false, error: `Board lookup failed: ${boardErr.message}` };
  if (!board) return { ok: false, error: "Board not found." };
  if (board.owner_id !== user.id) {
    return { ok: false, error: "You don't own this board." };
  }

  // Freemium photo cap (Lock 3). Counts user-supplied photos only — renders +
  // chips are free. Hard block at the cap with an upgrade nudge.
  const photoCap = await moodBoardPhotoCap(user.id, board.tenant_id as string);
  if ((await countBoardPhotos(admin, board.id as string)) >= photoCap.cap) {
    return { ok: false, error: photoCapMessage(photoCap) };
  }

  const objectKey = `${board.tenant_id}/${board.id}/${randomUUID()}.${extForMime(file.type)}`;
  const ingest = await ingestBytes({
    kind: "mood_board_pin",
    objectKey,
    contentType: file.type,
    bytes: await file.arrayBuffer(),
    tenantId: board.tenant_id as string,
    uploadedBy: user.id,
  });
  if (!ingest.ok) return { ok: false, error: ingest.error };

  // Insert the pin row. `position` is the integer sort-order column; actual
  // canvas positions live in mood_boards.canvas_state.
  const { data: pin, error: pinErr } = await admin
    .from("mood_board_pins")
    .insert({
      board_id: board.id,
      source: "upload",
      url: ingest.storagePath,
      added_by: user.id,
      position: 0,
      tags: slotTag ? [slotTag] : null,
    })
    .select("id")
    .single();

  if (pinErr || !pin) {
    // Best-effort cleanup of the storage object if the pin insert failed.
    await removeObjects(ingest.bucket, [ingest.storagePath]);
    return { ok: false, error: `Pin insert failed: ${pinErr?.message ?? "unknown"}` };
  }

  revalidatePath("/mood-board");

  return {
    ok: true,
    pin: {
      id: pin.id as string,
      image_path: ingest.storagePath,
      signed_url: ingest.url,
      source: "upload",
    },
  };
}
