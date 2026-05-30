/**
 * Unit tests for the venue-calendar CSV-import pure helpers (Session C).
 *
 * Run: `npm run test:unit` (globs lib/**\/*.test.ts) or
 * `node --experimental-strip-types --test lib/venu/csv-import-shared.test.ts`.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseCsvText,
  autoDetectMapping,
  parseLooseDateToIso,
  normalizeTime,
  rowsToCandidates,
  csvSourceRef,
  processCsv,
  type CsvMapping,
} from "./csv-import-shared.ts";

describe("parseCsvText", () => {
  test("basic comma rows + header trim", () => {
    const { headers, rows } = parseCsvText("Date,Note\n2026-10-15,Wedding\n2026-10-16,Gala\n");
    assert.deepEqual(headers, ["Date", "Note"]);
    assert.deepEqual(rows, [
      ["2026-10-15", "Wedding"],
      ["2026-10-16", "Gala"],
    ]);
  });

  test("quoted field with embedded comma", () => {
    const { rows } = parseCsvText('Date,Note\n2026-10-15,"Smith, Jones wedding"\n');
    assert.deepEqual(rows[0], ["2026-10-15", "Smith, Jones wedding"]);
  });

  test('escaped "" quotes inside a quoted field', () => {
    const { rows } = parseCsvText('Date,Note\n2026-10-15,"The ""Big"" Day"\n');
    assert.deepEqual(rows[0], ["2026-10-15", 'The "Big" Day']);
  });

  test("embedded newline inside quotes stays one field", () => {
    const { rows } = parseCsvText('Date,Note\n2026-10-15,"line one\nline two"\n');
    assert.equal(rows.length, 1);
    assert.equal(rows[0][1], "line one\nline two");
  });

  test("CRLF line endings", () => {
    const { headers, rows } = parseCsvText("Date,Note\r\n2026-10-15,Wedding\r\n");
    assert.deepEqual(headers, ["Date", "Note"]);
    assert.deepEqual(rows, [["2026-10-15", "Wedding"]]);
  });

  test("BOM is stripped from the first header", () => {
    const { headers } = parseCsvText("﻿Date,Note\n2026-10-15,x\n");
    assert.equal(headers[0], "Date");
  });

  test("tab-delimited (.tsv) auto-detected", () => {
    const { headers, rows } = parseCsvText("Date\tNote\n2026-10-15\tWedding\n");
    assert.deepEqual(headers, ["Date", "Note"]);
    assert.deepEqual(rows, [["2026-10-15", "Wedding"]]);
  });

  test("blank trailing line dropped; no final newline OK", () => {
    const { rows } = parseCsvText("Date,Note\n2026-10-15,x\n\n");
    assert.equal(rows.length, 1);
    const noTrailing = parseCsvText("Date,Note\n2026-10-15,x");
    assert.equal(noTrailing.rows.length, 1);
  });

  test("empty / whitespace input yields no headers or rows", () => {
    assert.deepEqual(parseCsvText(""), { headers: [], rows: [] });
    assert.deepEqual(parseCsvText("   \n  "), { headers: [], rows: [] });
  });
});

describe("autoDetectMapping", () => {
  test("maps common Tripleseat/Google-style headers", () => {
    const m = autoDetectMapping(["Event Date", "Start Time", "End Time", "Event Name"]);
    assert.equal(m.blocked_date, "Event Date");
    assert.equal(m.start_time, "Start Time");
    assert.equal(m.end_time, "End Time");
    assert.equal(m.reason, "Event Name");
  });

  test("does not assign one header to two targets", () => {
    const m = autoDetectMapping(["Date", "Title"]);
    assert.equal(m.blocked_date, "Date");
    assert.equal(m.reason, "Title");
    assert.equal(m.start_time, null);
    assert.equal(m.end_time, null);
  });

  test("unmapped when nothing matches", () => {
    const m = autoDetectMapping(["foo", "bar"]);
    assert.equal(m.blocked_date, null);
  });
});

describe("parseLooseDateToIso", () => {
  test("ISO passes through", () => {
    assert.equal(parseLooseDateToIso("2026-10-15"), "2026-10-15");
    assert.equal(parseLooseDateToIso("2026-10-15T18:30:00"), "2026-10-15");
  });
  test("US slash + dash, 4-digit year", () => {
    assert.equal(parseLooseDateToIso("10/15/2026"), "2026-10-15");
    assert.equal(parseLooseDateToIso("1/5/2026"), "2026-01-05");
    assert.equal(parseLooseDateToIso("10-15-2026"), "2026-10-15");
  });
  test("two-digit year maps to 20YY", () => {
    assert.equal(parseLooseDateToIso("1/5/26"), "2026-01-05");
  });
  test("rejects impossible dates", () => {
    assert.equal(parseLooseDateToIso("13/40/2026"), null);
    assert.equal(parseLooseDateToIso("02/30/2026"), null);
    assert.equal(parseLooseDateToIso("not a date"), null);
    assert.equal(parseLooseDateToIso(""), null);
  });
});

describe("normalizeTime", () => {
  test("24h forms", () => {
    assert.equal(normalizeTime("9:00"), "09:00:00");
    assert.equal(normalizeTime("13:45"), "13:45:00");
    assert.equal(normalizeTime("13:45:30"), "13:45:30");
  });
  test("12h AM/PM", () => {
    assert.equal(normalizeTime("9:00 AM"), "09:00:00");
    assert.equal(normalizeTime("1:45 pm"), "13:45:00");
    assert.equal(normalizeTime("12:00 AM"), "00:00:00");
    assert.equal(normalizeTime("12:00 PM"), "12:00:00");
  });
  test("empty → null; junk → null", () => {
    assert.equal(normalizeTime(""), null);
    assert.equal(normalizeTime("noon"), null);
    assert.equal(normalizeTime("25:00"), null);
    assert.equal(normalizeTime("9:75"), null);
  });
});

describe("rowsToCandidates", () => {
  const headers = ["Date", "Start", "End", "Note"];
  const mapping: CsvMapping = {
    blocked_date: "Date",
    start_time: "Start",
    end_time: "End",
    reason: "Note",
  };

  test("valid partial-day window", () => {
    const { candidates, issues } = rowsToCandidates(
      headers,
      [["10/15/2026", "9:00 AM", "5:00 PM", "Wedding"]],
      mapping,
    );
    assert.equal(issues.length, 0);
    assert.deepEqual(candidates[0], {
      blockedDate: "2026-10-15",
      startTime: "09:00:00",
      endTime: "17:00:00",
      reason: "Wedding",
    });
  });

  test("missing/garbled times degrade to whole-day, not an error", () => {
    const { candidates, issues } = rowsToCandidates(
      headers,
      [["2026-10-15", "", "", "Blackout"]],
      mapping,
    );
    assert.equal(issues.length, 0);
    assert.equal(candidates[0].startTime, null);
    assert.equal(candidates[0].endTime, null);
  });

  test("end <= start collapses to whole-day", () => {
    const { candidates } = rowsToCandidates(
      headers,
      [["2026-10-15", "5:00 PM", "9:00 AM", "x"]],
      mapping,
    );
    assert.equal(candidates[0].startTime, null);
  });

  test("bad date becomes an issue, not a candidate", () => {
    const { candidates, issues } = rowsToCandidates(
      headers,
      [["banana", "", "", "x"]],
      mapping,
    );
    assert.equal(candidates.length, 0);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].rowNumber, 2);
  });
});

describe("csvSourceRef", () => {
  test("deterministic + distinguishes time windows", () => {
    const whole = csvSourceRef({ blockedDate: "2026-10-15", startTime: null, endTime: null, reason: null });
    const partial = csvSourceRef({ blockedDate: "2026-10-15", startTime: "09:00:00", endTime: "17:00:00", reason: null });
    assert.equal(whole, "csv:2026-10-15:-");
    assert.equal(partial, "csv:2026-10-15:09:00:00-17:00:00");
    assert.notEqual(whole, partial);
  });
  test("same candidate → same ref (idempotency basis)", () => {
    const c = { blockedDate: "2026-10-15", startTime: null, endTime: null, reason: "y" };
    assert.equal(csvSourceRef(c), csvSourceRef({ ...c, reason: "different note" }));
  });
});

describe("processCsv (end to end)", () => {
  test("auto-maps and validates a realistic export", () => {
    const csv = [
      "Event Date,Start Time,End Time,Event Name",
      "10/15/2026,9:00 AM,5:00 PM,Smith Wedding",
      '11/02/2026,,,"Owner blackout"',
      "garbage,,,bad row",
    ].join("\n");
    const out = processCsv(csv);
    assert.equal(out.totalDataRows, 3);
    assert.equal(out.candidates.length, 2);
    assert.equal(out.issues.length, 1);
    assert.equal(out.suggestedMapping.blocked_date, "Event Date");
  });
});
