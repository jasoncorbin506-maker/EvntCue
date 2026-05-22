"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lock 22 — list soft-deleted pins from the last 30 days for the Recently
 * Removed tray. Client-callable (no automatic revalidate triggers needed —
 * the tray refetches itself when opened or after a restore).
 *
 * Returns the same shape PinnedImage / SwatchPin / TypographyPin expect for
 * rendering small previews, plus deleted_at so the UI can group by recency.
 *
 * Signed URLs are minted with a shorter TTL (5 min) since the tray is
 * ephemeral by design — users restore + canvas reload re-mints fresh URLs.
 */

export type RecentlyDeletedPin = {
  id: string;
  source: "upload" | "unsplash" | "pexels" | "url" | "render" | "chip";
  image_path: string;
  signed_url: string | null;
  tags: string[];
  deleted_at: string;
};

export type ListResult =
  | { ok: true; pins: RecentlyDeletedPin[] }
  | { ok: false; error: string };

export async function listRecentlyDeletedPinsAction(args: {
  boardId: string;
}): Promise<ListResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

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

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error: queryErr } = await admin
    .from("mood_board_pins")
    .select("id, source, url, tags, deleted_at")
    .eq("board_id", board.id)
    .not("deleted_at", "is", null)
    .gte("deleted_at", thirtyDaysAgo)
    .order("deleted_at", { ascending: false });
  if (queryErr) return { ok: false, error: `Query failed: ${queryErr.message}` };

  const pins: RecentlyDeletedPin[] = [];
  for (const row of rows ?? []) {
    const imagePath = row.url as string;
    const source = row.source as RecentlyDeletedPin["source"];
    const tags = (row.tags as string[] | null) ?? [];

    let signedUrl: string | null = null;
    if (!imagePath.startsWith("chip://")) {
      const { data: signed } = await admin.storage
        .from("mood-board-renders")
        .createSignedUrl(imagePath, 5 * 60);
      signedUrl = signed?.signedUrl ?? null;
    }

    pins.push({
      id: row.id as string,
      source,
      image_path: imagePath,
      signed_url: signedUrl,
      tags,
      deleted_at: row.deleted_at as string,
    });
  }

  return { ok: true, pins };
}
