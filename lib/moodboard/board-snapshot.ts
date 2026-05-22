/**
 * Mood Board snapshot serializer — the Chunk D seam.
 *
 * Pure function. No DB access. Takes a board snapshot from the loader
 * (load-board.ts output + a bit of event context) and returns the
 * structured JSON shape Cue's prompt assembler (Chunk D) will consume.
 *
 * The snapshot carries fabric pick + dropped chips + tagged pins. Slot
 * tags (from B-4 suggested uploads) + chip selections (from B-1/B-2/B-3)
 * + fabric foundation (from B-0) together give the assembler enough
 * structured context to generate slot-aware 10-slot editorial spreads
 * without re-querying the DB.
 *
 * Per Lock 17 "thin wrapper, fat pipe": we persist whatever shape the
 * client serializes (canvas_state JSONB), and this serializer projects
 * that shape into the assembler's required input. If the assembler's
 * needs evolve, change the projection here, not the storage shape.
 *
 * Per the Chunk B brief: lands in this chunk so Chunk D can plug in
 * cleanly. Three unit tests against fixtures in
 * `./board-snapshot.test.ts`.
 */

import type { EventCategory } from "@/data/moodboard/types";

/**
 * Input — what the loader produces (a board row + its pins + event context).
 */
export interface BoardWithPins {
  boardId: string;
  eventCategory: EventCategory | null;
  eventSubtype: string | null;
  /** Whatever the client wrote into mood_boards.canvas_state JSONB. */
  canvasState: ClientCanvasState | Record<string, never>;
  pins: LoadedPinForSnapshot[];
}

export interface LoadedPinForSnapshot {
  pinId: string;
  source: "url" | "upload" | "chip" | "unsplash" | "pexels" | "render";
  /** Set when source = 'chip'. References data/moodboard chip key. */
  chipKey?: string;
  /** Storage object key. Set when source = 'upload' / 'render'. */
  imagePath?: string;
  /** Fresh signed URL — refresh at snapshot time. */
  signedUrl?: string;
  /** mood_board_pins.tags TEXT[] — B-4 slot labels live here. */
  slotTags: string[];
  position: {
    x: number;
    y: number;
    rotation: number;
  };
}

/**
 * The client canvas_state shape we expect after B-0 ships. Older boards
 * (Chunk A only) may have just `{pins: {pinId: {x, y, rotation, z}}}`;
 * we tolerate that by treating fabric/chipSelections as optional.
 */
export interface ClientCanvasState {
  pins?: Record<string, { x: number; y: number; rotation: number; z: number }>;
  fabric?: {
    chipKey: string;
    primaryColor: string;
    fabricType: string;
  } | null;
  chipSelections?: {
    mood?: string[];
    material?: string[];
    florals?: string[];
    typography?: string[];
  };
}

/**
 * Output — what Cue's prompt assembler consumes.
 */
export interface BoardSnapshot {
  boardId: string;
  eventCategory: EventCategory;
  eventSubtype: string | null;
  fabric: {
    chipKey: string;
    primaryColor: string;
    fabricType: string;
  } | null;
  chipSelections: {
    mood: string[];
    material: string[];
    florals: string[];
    typography: string[];
  };
  pins: Array<{
    pinId: string;
    source: "url" | "upload" | "chip" | "unsplash" | "pexels" | "render";
    chipKey: string | null;
    imagePath: string | null;
    signedUrl: string | null;
    slotTags: string[];
    position: { x: number; y: number; rotation: number };
  }>;
}

/**
 * Pure projection from BoardWithPins → BoardSnapshot.
 *
 * - Tolerates legacy canvas_state shapes (Chunk A pins-only) by defaulting
 *   fabric to null + chipSelections to empty arrays.
 * - Defaults eventCategory to 'wedding' if the input is null (matches the
 *   byCategory() generic fallback semantics).
 * - Pin shape normalized: optional fields explicitly null instead of
 *   undefined for deterministic JSON serialization.
 */
export function serializeBoard(input: BoardWithPins): BoardSnapshot {
  const cs = (input.canvasState ?? {}) as ClientCanvasState;
  const chipSelections = cs.chipSelections ?? {};

  return {
    boardId: input.boardId,
    eventCategory: input.eventCategory ?? "wedding",
    eventSubtype: input.eventSubtype,
    fabric: cs.fabric ?? null,
    chipSelections: {
      mood: chipSelections.mood ?? [],
      material: chipSelections.material ?? [],
      florals: chipSelections.florals ?? [],
      typography: chipSelections.typography ?? [],
    },
    pins: input.pins.map((p) => ({
      pinId: p.pinId,
      source: p.source,
      chipKey: p.chipKey ?? null,
      imagePath: p.imagePath ?? null,
      signedUrl: p.signedUrl ?? null,
      slotTags: p.slotTags ?? [],
      position: p.position,
    })),
  };
}
