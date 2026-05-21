import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side fetcher for the orgnz mood board surface (Chunk A).
 *
 * Returns the user's primary mood_board (one per orgnz tenant for v1; multi-
 * board lands with PARKING_LOT #61 multi-event support). Creates the row if
 * none exists — idempotent for the first-visit case.
 *
 * Architectural note (Lock 17 — thin wrapper, fat pipe):
 *   - Each pin's IMAGE is a `mood_board_pins` row (one row per pinned asset).
 *   - Each pin's POSITION ON THE CANVAS lives in `mood_boards.canvas_state`
 *     (JSONB keyed by pin_id). Centralizing layout state on the board lets
 *     us persist drag-arrange with a single UPDATE per drag-end instead of
 *     N row updates, and matches Lock 17's "client decides the shape."
 *
 * RLS scoping: reads via createClient (anon key → authenticated role). The
 * mood_boards / mood_board_pins SELECT policies (mb_select / mbp_select)
 * scope by owner_id / tenant_id / member-role. Cross-tenant pins are
 * filtered out by Postgres, not by app code.
 *
 * Storage signed URLs: each pin's `image_path` (the storage object key) is
 * exchanged for a 1-hour signed URL at fetch time. The admin client mints
 * the URL because Storage signed-URL generation goes through service-role.
 * The signed URL itself carries no further auth; the user's session is
 * what bounded which pin rows surfaced in the first place.
 */

export type CanvasPinLayout = {
  x: number;        // px from board origin
  y: number;        // px from board origin
  rotation: number; // degrees, typically -3 to +3
  z: number;        // stacking order
};

export type CanvasState = {
  pins?: Record<string, CanvasPinLayout>; // keyed by pin_id
};

export type LoadedPin = {
  id: string;
  source: "upload" | "unsplash" | "pexels" | "url" | "render";
  image_path: string;     // storage object key (NOT a URL)
  signed_url: string;     // 1h signed URL for <img src>
  source_url: string | null;
  position: CanvasPinLayout;
};

export type LoadedBoard = {
  board_id: string;
  canvas_state: CanvasState;
  pins: LoadedPin[];
};

const DEFAULT_POSITION: CanvasPinLayout = { x: 24, y: 24, rotation: 0, z: 1 };

/**
 * Load or create the user's primary mood_board for the current orgnz tenant.
 *
 * Throws on auth failure (caller is expected to redirect to /login first).
 */
export async function loadOrCreateBoard(): Promise<LoadedBoard | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  // Resolve the user's orgnz tenant. Mirrors the loadOrgnzContext pattern.
  const { data: roleRows } = await admin
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "orgnz")
    .limit(1);
  const tenantId = (roleRows?.[0]?.tenant_id as string | undefined) ?? null;
  if (!tenantId) return null;

  // Find existing primary board for this tenant. Single board per tenant
  // is the v1 model; future multi-board work hangs off this fetcher.
  const { data: existingBoards } = await admin
    .from("mood_boards")
    .select("id, canvas_state")
    .eq("tenant_id", tenantId)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  let boardId: string;
  let canvasState: CanvasState;

  if (existingBoards && existingBoards.length > 0) {
    const row = existingBoards[0];
    boardId = row.id as string;
    canvasState = (row.canvas_state as CanvasState | null) ?? {};
  } else {
    // First visit — create a private board owned by this user.
    const { data: created, error: createErr } = await admin
      .from("mood_boards")
      .insert({
        owner_id: user.id,
        tenant_id: tenantId,
        title: "Your mood board",
        visibility: "private",
      })
      .select("id, canvas_state")
      .single();
    if (createErr || !created) {
      throw new Error(`Could not create mood board: ${createErr?.message ?? "unknown"}`);
    }
    boardId = created.id as string;
    canvasState = (created.canvas_state as CanvasState | null) ?? {};
  }

  // Load this board's pins.
  const { data: pinRows } = await admin
    .from("mood_board_pins")
    .select("id, source, url, source_url")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  const pinsRaw = pinRows ?? [];

  // Mint a fresh 1h signed URL per pin. The `url` column holds the storage
  // object key (e.g. `<tenant_id>/<board_id>/<nanoid>.jpg`) — NOT a public
  // URL, because the bucket is private.
  const layoutMap = canvasState.pins ?? {};
  const pins: LoadedPin[] = [];

  for (const row of pinsRaw) {
    const pinId = row.id as string;
    const imagePath = row.url as string;
    const source = row.source as LoadedPin["source"];
    const sourceUrl = (row.source_url as string | null) ?? null;

    // Storage signed URL. 1h TTL; refresh on every page load.
    const { data: signed } = await admin.storage
      .from("mood-board-renders")
      .createSignedUrl(imagePath, 60 * 60);

    if (!signed?.signedUrl) continue; // Skip rows whose storage object went missing.

    pins.push({
      id: pinId,
      source,
      image_path: imagePath,
      signed_url: signed.signedUrl,
      source_url: sourceUrl,
      position: layoutMap[pinId] ?? DEFAULT_POSITION,
    });
  }

  return {
    board_id: boardId,
    canvas_state: canvasState,
    pins,
  };
}
