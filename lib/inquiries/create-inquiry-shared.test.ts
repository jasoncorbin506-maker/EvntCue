/**
 * Unit tests for the Phase 2b-W1 inquiry-creation pure helpers.
 *
 * Run: `npm run test:unit` (globs lib/**\/*.test.ts) or
 * `node --experimental-strip-types --test lib/inquiries/create-inquiry-shared.test.ts`.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  INQUIRY_ERRORS,
  MESSAGE_MAX,
  tenantTypeToSellerPortal,
  validateInquiryMessage,
  resolveInquiryEventDate,
} from "./create-inquiry-shared.ts";

describe("tenantTypeToSellerPortal", () => {
  test("seller types map to portal labels", () => {
    assert.equal(tenantTypeToSellerPortal("vndr"), "vndr");
    assert.equal(tenantTypeToSellerPortal("catr"), "catr");
    assert.equal(tenantTypeToSellerPortal("plnr"), "plnr");
  });
  test("venue tenant type maps to the 'venu' portal label (the one rename)", () => {
    assert.equal(tenantTypeToSellerPortal("venue"), "venu");
  });
  test("orgnz is never a valid inquiry recipient → null", () => {
    assert.equal(tenantTypeToSellerPortal("orgnz"), null);
  });
  test("unknown / null / undefined → null", () => {
    assert.equal(tenantTypeToSellerPortal("admin"), null);
    assert.equal(tenantTypeToSellerPortal(null), null);
    assert.equal(tenantTypeToSellerPortal(undefined), null);
  });
});

describe("validateInquiryMessage", () => {
  test("trims and accepts a real message", () => {
    const r = validateInquiryMessage("  hello there  ");
    assert.deepEqual(r, { ok: true, message: "hello there" });
  });
  test("blank / whitespace-only / null → MISSING_MESSAGE", () => {
    for (const v of ["", "   ", "\n\t", null, undefined]) {
      const r = validateInquiryMessage(v);
      assert.equal(r.ok, false);
      if (!r.ok) assert.equal(r.error, INQUIRY_ERRORS.MISSING_MESSAGE);
    }
  });
  test("caps overly long messages at MESSAGE_MAX", () => {
    const long = "x".repeat(MESSAGE_MAX + 500);
    const r = validateInquiryMessage(long);
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.message.length, MESSAGE_MAX);
  });
});

describe("resolveInquiryEventDate", () => {
  test("uses the buyer's date hint when present", () => {
    assert.equal(resolveInquiryEventDate("2027-05-01", "2027-09-09"), "2027-05-01");
  });
  test("defaults to the event start_date when hint is blank / absent", () => {
    assert.equal(resolveInquiryEventDate("", "2027-09-09"), "2027-09-09");
    assert.equal(resolveInquiryEventDate("   ", "2027-09-09"), "2027-09-09");
    assert.equal(resolveInquiryEventDate(null, "2027-09-09"), "2027-09-09");
    assert.equal(resolveInquiryEventDate(undefined, "2027-09-09"), "2027-09-09");
  });
});
