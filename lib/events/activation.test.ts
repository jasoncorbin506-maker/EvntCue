/**
 * Unit tests for the Lock 27 activation-gate predicates.
 *
 * Run: `npm run test:unit` (globs lib/**\/*.test.ts) or
 * `node --experimental-strip-types --test lib/events/activation.test.ts`.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  EVENT_NOT_ACTIVATED,
  isEventActive,
  isEventDraft,
  assertEventActive,
  canActivate,
} from "./activation.ts";

describe("isEventActive / isEventDraft", () => {
  test("active", () => {
    assert.equal(isEventActive("active"), true);
    assert.equal(isEventDraft("active"), false);
  });
  test("draft", () => {
    assert.equal(isEventActive("draft"), false);
    assert.equal(isEventDraft("draft"), true);
  });
  test("null / unknown are neither active nor (necessarily) draft", () => {
    assert.equal(isEventActive(null), false);
    assert.equal(isEventActive(undefined), false);
    assert.equal(isEventDraft(null), false);
    assert.equal(isEventActive("archived"), false);
  });
});

describe("assertEventActive (the transactional gate)", () => {
  test("active → ok", () => {
    assert.deepEqual(assertEventActive("active"), { ok: true });
  });
  test("draft → typed error", () => {
    assert.deepEqual(assertEventActive("draft"), {
      ok: false,
      error: EVENT_NOT_ACTIVATED,
    });
  });
  test("null → typed error (fail closed)", () => {
    assert.deepEqual(assertEventActive(null), {
      ok: false,
      error: EVENT_NOT_ACTIVATED,
    });
  });
});

describe("canActivate (the activate-event guard)", () => {
  test("draft + date → ok", () => {
    assert.deepEqual(canActivate("draft", "2027-05-01"), { ok: true });
  });
  test("draft without a date → no_date", () => {
    assert.deepEqual(canActivate("draft", null), { ok: false, reason: "no_date" });
  });
  test("already active → not_draft (caller treats as no-op success)", () => {
    assert.deepEqual(canActivate("active", "2027-05-01"), {
      ok: false,
      reason: "not_draft",
    });
  });
  test("unknown status → not_draft", () => {
    assert.deepEqual(canActivate(null, "2027-05-01"), {
      ok: false,
      reason: "not_draft",
    });
  });
});
