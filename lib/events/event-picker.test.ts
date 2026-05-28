/**
 * Unit tests for the PL #61 Orgnz event-picker helpers.
 *
 * Run with: `npm run test:unit` (globs lib/**\/*.test.ts) or
 * `node --experimental-strip-types --test lib/events/event-picker.test.ts`.
 *
 * Uses Node's built-in test runner — matches the existing pattern in
 * lib/moodboard/*.test.ts. No new dependency.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
// Explicit .ts extension required for Node's experimental type-strip mode.
import {
  compareEventsForPicker,
  sortEventsForPicker,
  resolveSelectedEvent,
  humanizeEventType,
} from "./event-picker.ts";

const TODAY = "2026-05-28";

describe("sortEventsForPicker", () => {
  test("soonest upcoming first, then most-recent past, then undated", () => {
    const events = [
      { id: "past-old", start_date: "2024-01-01" },
      { id: "future-far", start_date: "2027-12-31" },
      { id: "undated", start_date: null },
      { id: "future-soon", start_date: "2026-06-01" },
      { id: "past-recent", start_date: "2026-01-01" },
      { id: "today", start_date: TODAY },
    ];
    const order = sortEventsForPicker(events, TODAY).map((e) => e.id);
    assert.deepEqual(order, [
      "today", // today counts as upcoming (>= today), soonest
      "future-soon",
      "future-far",
      "past-recent", // past, most-recent first
      "past-old",
      "undated", // always last
    ]);
  });

  test("does not mutate the input array", () => {
    const events = [
      { id: "a", start_date: "2027-01-01" },
      { id: "b", start_date: "2026-06-01" },
    ];
    const snapshot = events.map((e) => e.id);
    sortEventsForPicker(events, TODAY);
    assert.deepEqual(
      events.map((e) => e.id),
      snapshot,
    );
  });

  test("compareEventsForPicker treats two undated as equal", () => {
    assert.equal(
      compareEventsForPicker({ start_date: null }, { start_date: null }, TODAY),
      0,
    );
  });
});

describe("resolveSelectedEvent", () => {
  const list = [
    { id: "newest" }, // created_at-desc → index 0 is the default
    { id: "older" },
    { id: "oldest" },
  ];

  test("no requested id → most-recent (index 0), not flagged", () => {
    const r = resolveSelectedEvent(list, null);
    assert.equal(r.selected?.id, "newest");
    assert.equal(r.eventNotFound, false);
  });

  test("valid requested id → that event, not flagged", () => {
    const r = resolveSelectedEvent(list, "older");
    assert.equal(r.selected?.id, "older");
    assert.equal(r.eventNotFound, false);
  });

  test("invalid/foreign id → falls back to most-recent + flagged", () => {
    const r = resolveSelectedEvent(list, "not-a-real-id");
    assert.equal(r.selected?.id, "newest");
    assert.equal(r.eventNotFound, true);
  });

  test("empty tenant → null, not flagged when no id requested", () => {
    const r = resolveSelectedEvent([], null);
    assert.equal(r.selected, null);
    assert.equal(r.eventNotFound, false);
  });

  test("empty tenant + requested id → null, flagged", () => {
    const r = resolveSelectedEvent([], "anything");
    assert.equal(r.selected, null);
    assert.equal(r.eventNotFound, true);
  });
});

describe("humanizeEventType", () => {
  test("single word", () => {
    assert.equal(humanizeEventType("wedding"), "Wedding");
  });
  test("underscored slug", () => {
    assert.equal(humanizeEventType("corporate_gala"), "Corporate Gala");
  });
  test("collapses extra separators", () => {
    assert.equal(humanizeEventType("milestone__birthday  party"), "Milestone Birthday Party");
  });
});
