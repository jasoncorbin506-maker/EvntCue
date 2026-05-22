import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventCategory } from "@/data/moodboard/types";

/**
 * Server-side fetcher for the orgnz mood board surface (Chunk A foundation,
 * extended in Chunk B for fabric foundation + chip selections + event context).
 *
 * Returns the user's primary mood_board with full canvas state (Chunk B:
 * pins + fabric + chipSelections), plus event context (eventCategory +
 * eventSubtype) used for per-event-type suggested-upload slot rotation.
 *
 * Per Lock 17 ("we persist whatever the client serializes"), canvas_state
 * JSONB is the client's shape. We surface it whole to the client component
 * so layout / fabric / chipSelections all flow through one round-trip.
 *
 * Storage signed URLs: each pin's `image_path` is exchanged for a 1h
 * signed URL via the admin client (signed-URL generation goes through
 * service-role; user-scoping was already enforced by RLS on the pin row
 * fetch above).
 */

export type CanvasPinLayout = {
  x: number;
  y: number;
  rotation: number;
  z: number;
};

export type FabricSelection = {
  chipKey: string;
  primaryColor: string;
  fabricType: string;
};

export type CanvasState = {
  pins?: Record<string, CanvasPinLayout>;
  fabric?: FabricSelection | null;
  chipSelections?: {
    mood?: string[];
    material?: string[];
    florals?: string[];
    typography?: string[];
  };
};

export type LoadedPin = {
  id: string;
  source: "upload" | "unsplash" | "pexels" | "url" | "render" | "chip";
  /** For upload/url/render/unsplash/pexels pins: storage object key.
   *  For chip pins (Chunk B): sentinel like `chip://<chipKey>`. */
  image_path: string;
  /** For upload/url/render/unsplash/pexels pins: 1h signed URL.
   *  For chip pins: null (rendered by SwatchPin / TypographyPin instead). */
  signed_url: string | null;
  source_url: string | null;
  /** Chunk B — mood_board_pins.tags array; carries B-4 slot labels + the
   *  `chip:<key>` sentinel for chip pins when source enum stays at 'url'. */
  tags: string[];
  position: CanvasPinLayout;
};

export type LoadedBoard = {
  board_id: string;
  canvas_state: CanvasState;
  pins: LoadedPin[];
  event_category: EventCategory | null;
  event_subtype: string | null;
  event_name: string | null;
  event_start_date: string | null;
};

const DEFAULT_POSITION: CanvasPinLayout = { x: 24, y: 24, rotation: 0, z: 1 };

/**
 * event_type enum → EventCategory mapping. The `events.event_type` enum
 * has more granular values than our 5 chip categories — collapse them.
 */
function categoryFromEventType(eventType: string | null): EventCategory | null {
  if (!eventType) return null;
  if (eventType.includes("wedding")) return "wedding";
  if (eventType.includes("corporate") || eventType === "conference" || eventType === "summit") return "corporate";
  if (eventType.includes("nonprofit") || eventType === "gala" || eventType === "fundraiser") return "nonprofit";
  if (eventType === "public" || eventType === "cultural" || eventType === "festival") return "public";
  return "social";
}

export async function loadOrCreateBoard(): Promise<LoadedBoard | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const { data: roleRows } = await admin
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "orgnz")
    .limit(1);
  const tenantId = (roleRows?.[0]?.tenant_id as string | undefined) ?? null;
  if (!tenantId) return null;

  // Find the user's primary event (most recent, for B-4 slot rotation).
  // Multi-event lands with PARKING_LOT #61.
  const { data: eventRows } = await admin
    .from("events")
    .select("id, name, event_type, event_subtype, start_date")
    .eq("orgnz_tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1);
  const event = eventRows?.[0] ?? null;

  // Find or create the board.
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
    const { data: created, error: createErr } = await admin
      .from("mood_boards")
      .insert({
        owner_id: user.id,
        tenant_id: tenantId,
        title: "Your mood board",
        visibility: "private",
        event_id: event?.id ?? null,
      })
      .select("id, canvas_state")
      .single();
    if (createErr || !created) {
      throw new Error(`Could not create mood board: ${createErr?.message ?? "unknown"}`);
    }
    boardId = created.id as string;
    canvasState = (created.canvas_state as CanvasState | null) ?? {};
  }

  // Load pins. Chunk B adds `tags` to the projection. Lock 22 filters
  // soft-deleted rows — they live in the Recently Removed tray instead.
  const { data: pinRows } = await admin
    .from("mood_board_pins")
    .select("id, source, url, source_url, tags")
    .eq("board_id", boardId)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  const pinsRaw = pinRows ?? [];
  const layoutMap = canvasState.pins ?? {};
  const pins: LoadedPin[] = [];

  for (const row of pinsRaw) {
    const pinId = row.id as string;
    const imagePath = row.url as string;
    const source = row.source as LoadedPin["source"];
    const sourceUrl = (row.source_url as string | null) ?? null;
    const tags = (row.tags as string[] | null) ?? [];

    let signedUrl: string | null = null;

    // Chip pins don't have a real storage object — their image_path is a
    // `chip://<key>` sentinel. SwatchPin / TypographyPin render from
    // chip data, not from signed URL.
    if (!imagePath.startsWith("chip://")) {
      const { data: signed } = await admin.storage
        .from("mood-board-renders")
        .createSignedUrl(imagePath, 60 * 60);
      if (!signed?.signedUrl) continue;
      signedUrl = signed.signedUrl;
    }

    pins.push({
      id: pinId,
      source,
      image_path: imagePath,
      signed_url: signedUrl,
      source_url: sourceUrl,
      tags,
      position: layoutMap[pinId] ?? DEFAULT_POSITION,
    });
  }

  return {
    board_id: boardId,
    canvas_state: canvasState,
    pins,
    event_category: categoryFromEventType((event?.event_type as string | null) ?? null),
    event_subtype: (event?.event_subtype as string | null) ?? null,
    event_name: (event?.name as string | null) ?? null,
    event_start_date: (event?.start_date as string | null) ?? null,
  };
}
