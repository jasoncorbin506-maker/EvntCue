/**
 * Unit tests for the board-snapshot serializer (B-5).
 *
 * Three fixtures per the Chunk B brief: empty / full / pins-only.
 *
 * Run with: `node --test lib/moodboard/board-snapshot.test.ts`
 * (or the test:unit npm script if added — see package.json).
 *
 * Uses Node's built-in test runner — matches the existing pattern in
 * lib/crypto/tenant-encryption.test.ts. No new dependency.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
// Explicit .ts extension required for Node's experimental type-strip mode.
// `tsc --noEmit` and bundlers tolerate the .ts suffix in TS imports.
import { serializeBoard, type BoardWithPins } from "./board-snapshot.ts";

describe("serializeBoard", () => {
  test("empty board — no fabric, no chips, no pins → all defaults", () => {
    const input: BoardWithPins = {
      boardId: "00000000-0000-4000-8000-000000000001",
      eventCategory: "wedding",
      eventSubtype: null,
      canvasState: {},
      pins: [],
    };

    const out = serializeBoard(input);

    assert.equal(out.boardId, input.boardId);
    assert.equal(out.eventCategory, "wedding");
    assert.equal(out.eventSubtype, null);
    assert.equal(out.fabric, null);
    assert.deepEqual(out.chipSelections, {
      mood: [],
      material: [],
      florals: [],
      typography: [],
    });
    assert.deepEqual(out.pins, []);
  });

  test("full board — fabric set, all chip groups populated, mix of pin sources", () => {
    const input: BoardWithPins = {
      boardId: "00000000-0000-4000-8000-000000000002",
      eventCategory: "wedding",
      eventSubtype: "catholic-wedding",
      canvasState: {
        fabric: {
          chipKey: "sage-and-cream",
          primaryColor: "#B7C2A8",
          fabricType: "linen",
        },
        chipSelections: {
          mood: ["romantic", "intimate"],
          material: ["ivory-linen", "brass"],
          florals: ["garden-roses"],
          typography: ["cormorant-inter"],
        },
        pins: {
          "pin-upload-1": { x: 100, y: 50, rotation: 2.1, z: 10 },
          "pin-chip-1": { x: 200, y: 80, rotation: -1.5, z: 11 },
        },
      },
      pins: [
        {
          pinId: "pin-upload-1",
          source: "upload",
          imagePath: "tenant-a/board-b/abc.jpg",
          signedUrl: "https://signed.example/abc.jpg?token=xyz",
          slotTags: ["entry"],
          position: { x: 100, y: 50, rotation: 2.1 },
        },
        {
          pinId: "pin-chip-1",
          source: "chip",
          chipKey: "ivory-linen",
          slotTags: [],
          position: { x: 200, y: 80, rotation: -1.5 },
        },
      ],
    };

    const out = serializeBoard(input);

    assert.equal(out.eventCategory, "wedding");
    assert.equal(out.eventSubtype, "catholic-wedding");
    assert.deepEqual(out.fabric, {
      chipKey: "sage-and-cream",
      primaryColor: "#B7C2A8",
      fabricType: "linen",
    });
    assert.deepEqual(out.chipSelections.mood, ["romantic", "intimate"]);
    assert.deepEqual(out.chipSelections.material, ["ivory-linen", "brass"]);
    assert.equal(out.pins.length, 2);

    const uploadPin = out.pins.find((p) => p.pinId === "pin-upload-1")!;
    assert.equal(uploadPin.source, "upload");
    assert.equal(uploadPin.chipKey, null);
    assert.equal(uploadPin.imagePath, "tenant-a/board-b/abc.jpg");
    assert.deepEqual(uploadPin.slotTags, ["entry"]);

    const chipPin = out.pins.find((p) => p.pinId === "pin-chip-1")!;
    assert.equal(chipPin.source, "chip");
    assert.equal(chipPin.chipKey, "ivory-linen");
    assert.equal(chipPin.imagePath, null);
    assert.equal(chipPin.signedUrl, null);
  });

  test("pins-only board — legacy Chunk A canvas_state (just pins, no fabric/chipSelections)", () => {
    const input: BoardWithPins = {
      boardId: "00000000-0000-4000-8000-000000000003",
      eventCategory: null, // verify default-to-wedding fallback
      eventSubtype: null,
      canvasState: {
        pins: {
          "pin-1": { x: 0, y: 0, rotation: 0, z: 1 },
        },
        // No fabric, no chipSelections — pre-B-0 board.
      },
      pins: [
        {
          pinId: "pin-1",
          source: "upload",
          imagePath: "tenant-a/board-c/legacy.jpg",
          signedUrl: "https://signed.example/legacy.jpg?token=xyz",
          slotTags: [],
          position: { x: 0, y: 0, rotation: 0 },
        },
      ],
    };

    const out = serializeBoard(input);

    assert.equal(out.eventCategory, "wedding", "null category should default to wedding");
    assert.equal(out.fabric, null);
    assert.deepEqual(out.chipSelections, {
      mood: [],
      material: [],
      florals: [],
      typography: [],
    });
    assert.equal(out.pins.length, 1);
    assert.equal(out.pins[0].source, "upload");
  });
});
