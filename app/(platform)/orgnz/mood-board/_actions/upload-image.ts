"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — matches bucket file_size_limit
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

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
 * Mood Board Chunk A — receive a File from the client, validate, upload to
 * the private `mood-board-renders` bucket, insert a `mood_board_pins` row,
 * return enough metadata for the client to render the new pin immediately.
 *
 * Auth model: anon-client call surfaces user via createClient(). Storage
 * upload + DB insert run via createAdminClient (service role) because:
 *   (a) the bucket is private with no public-write policy,
 *   (b) the pin INSERT runs with the user's authed identity stamped into
 *       `added_by` regardless of who runs the SQL, so admin-client doesn't
 *       leak provenance.
 *
 * Path convention: `${tenant_id}/${board_id}/${randomUUID()}.${ext}` —
 * tenant prefix simplifies any future per-tenant cleanup or quota logic.
 */
export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("file");
  const boardId = String(formData.get("board_id") ?? "");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  if (!boardId) return { ok: false, error: "Missing board id." };

  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 10 MB or smaller." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: "Image must be JPEG, PNG, WEBP, or HEIC." };
  }

  const admin = createAdminClient();

  // Confirm the user owns (or is a member of) this board before letting
  // them upload to it. mb_select scoping would have hidden the board
  // server-side already, but defense in depth.
  const { data: board, error: boardErr } = await admin
    .from("mood_boards")
    .select("id, tenant_id, owner_id")
    .eq("id", boardId)
    .maybeSingle();
  if (boardErr) return { ok: false, error: `Board lookup failed: ${boardErr.message}` };
  if (!board) return { ok: false, error: "Board not found." };

  // Cheap ownership gate. Membership-based access lands when sharing ships.
  if (board.owner_id !== user.id) {
    return { ok: false, error: "You don't own this board." };
  }

  // Compose the storage object key.
  const ext = MIME_TO_EXT[file.type] ?? "bin";
  const objectKey = `${board.tenant_id}/${board.id}/${randomUUID()}.${ext}`;

  // Convert File → Buffer for the Supabase Storage upload API.
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadErr } = await admin.storage
    .from("mood-board-renders")
    .upload(objectKey, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadErr) return { ok: false, error: `Upload failed: ${uploadErr.message}` };

  // Insert the pin row. `position` is the integer sort-order column on the
  // original schema (used as a tiebreaker for stable load order). Actual
  // canvas positions live in `mood_boards.canvas_state` (per Lock 17 —
  // client-shape JSONB) and are written via save-canvas-state.ts.
  const { data: pin, error: pinErr } = await admin
    .from("mood_board_pins")
    .insert({
      board_id: board.id,
      source: "upload",
      url: objectKey,
      added_by: user.id,
      position: 0,
    })
    .select("id")
    .single();

  if (pinErr || !pin) {
    // Best-effort cleanup of the storage object if the pin insert failed.
    await admin.storage.from("mood-board-renders").remove([objectKey]);
    return { ok: false, error: `Pin insert failed: ${pinErr?.message ?? "unknown"}` };
  }

  // Mint the signed URL the client will use immediately.
  const { data: signed, error: signErr } = await admin.storage
    .from("mood-board-renders")
    .createSignedUrl(objectKey, 60 * 60);
  if (signErr || !signed?.signedUrl) {
    return { ok: false, error: `Signed URL failed: ${signErr?.message ?? "unknown"}` };
  }

  revalidatePath("/orgnz/mood-board");

  return {
    ok: true,
    pin: {
      id: pin.id as string,
      image_path: objectKey,
      signed_url: signed.signedUrl,
      source: "upload",
    },
  };
}
