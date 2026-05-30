/**
 * Client-safe CSV-import logic for the venue-calendar arc (Session C, scope
 * item B). NO `import "server-only"` here — the upload/commit server actions
 * AND the unit suite (node --test, which throws on server-only imports) both
 * pull from this module, and CsvImportSheet may render mapping helpers.
 *
 * Mirrors the availability-shared.ts split rationale (Hard Rule #10): pure
 * values + types live in a server-only-free module so any caller can import
 * without dragging the build graph into "server-only" territory.
 *
 * No dependency for parsing — the codebase prefers hand-rolled over a new dep
 * (cf. scripts/rls-isolation-test.mjs parsing .env.local manually). The parser
 * below is a small RFC-4180 state machine: quoted fields, "" escapes, commas
 * and newlines inside quotes, CRLF/LF, BOM strip. Delimiter auto-detects
 * comma vs tab (.csv / .tsv).
 */

export type CsvColumnKey = "blocked_date" | "start_time" | "end_time" | "reason";

/** Target column → source header name (null = unmapped). */
export type CsvMapping = Record<CsvColumnKey, string | null>;

export type CsvCandidate = {
  /** ISO date (YYYY-MM-DD). */
  blockedDate: string;
  /** HH:MM:SS or null for whole-day. */
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

/** A data row we couldn't turn into a candidate (bad/absent date). */
export type CsvRowIssue = {
  /** 1-based source line number (header is line 1). */
  rowNumber: number;
  reason: string;
  /** The raw cells joined, truncated, for operator context. */
  raw: string;
};

export type CsvProcessOutcome = {
  headers: string[];
  suggestedMapping: CsvMapping;
  totalDataRows: number;
  candidates: CsvCandidate[];
  issues: CsvRowIssue[];
};

export const CSV_COLUMN_KEYS: readonly CsvColumnKey[] = [
  "blocked_date",
  "start_time",
  "end_time",
  "reason",
] as const;

export const CSV_COLUMN_LABELS: Record<CsvColumnKey, string> = {
  blocked_date: "Date",
  start_time: "Start time",
  end_time: "End time",
  reason: "Note / event name",
};

/** Header strings (normalized) we auto-map to each target column. */
const HEADER_ALIASES: Record<CsvColumnKey, string[]> = {
  blocked_date: [
    "date",
    "event date",
    "booked date",
    "blocked date",
    "start date",
    "day",
    "when",
  ],
  start_time: ["start time", "start", "from", "begin", "time"],
  end_time: ["end time", "end", "to", "until", "finish"],
  reason: [
    "reason",
    "event",
    "title",
    "name",
    "event name",
    "note",
    "notes",
    "description",
    "client",
    "details",
  ],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

// -----------------------------------------------------------------------------
// RFC-4180 parser
// -----------------------------------------------------------------------------

/**
 * Parse delimited text into a header row + data rows. Returns the raw string
 * cells; date/time interpretation happens in rowsToCandidates. Empty input or
 * a header-only file yields rows: [].
 */
export function parseCsvText(input: string): { headers: string[]; rows: string[][] } {
  // Strip a leading UTF-8 BOM if present.
  let text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  // Normalize lone CR to LF; CRLF handled by skipping \r in the machine.
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (text.trim() === "") return { headers: [], rows: [] };

  const delimiter = detectDelimiter(text);
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      record.push(field);
      field = "";
    } else if (ch === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += ch;
    }
  }
  // Flush the trailing field/record (no final newline).
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  // Drop fully-empty records (e.g. a blank trailing line).
  const nonEmpty = records.filter(
    (r) => !(r.length === 1 && r[0].trim() === ""),
  );
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const [headerRow, ...dataRows] = nonEmpty;
  return {
    headers: headerRow.map((h) => h.trim()),
    rows: dataRows,
  };
}

function detectDelimiter(text: string): string {
  const firstLine = text.slice(0, text.indexOf("\n") === -1 ? text.length : text.indexOf("\n"));
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs > commas ? "\t" : ",";
}

// -----------------------------------------------------------------------------
// Mapping
// -----------------------------------------------------------------------------

export function autoDetectMapping(headers: string[]): CsvMapping {
  const normalized = headers.map(normalizeHeader);
  const mapping: CsvMapping = {
    blocked_date: null,
    start_time: null,
    end_time: null,
    reason: null,
  };
  const used = new Set<number>();

  for (const key of CSV_COLUMN_KEYS) {
    const aliases = HEADER_ALIASES[key];
    // Exact normalized match first, then substring.
    let idx = normalized.findIndex(
      (h, i) => !used.has(i) && aliases.includes(h),
    );
    if (idx === -1) {
      idx = normalized.findIndex(
        (h, i) => !used.has(i) && aliases.some((a) => h.includes(a)),
      );
    }
    if (idx !== -1) {
      mapping[key] = headers[idx];
      used.add(idx);
    }
  }
  return mapping;
}

// -----------------------------------------------------------------------------
// Date / time normalization (pure, US-centric — DFW launch market)
// -----------------------------------------------------------------------------

/**
 * Parse a loose date cell to an ISO YYYY-MM-DD string, or null if unreadable.
 * Accepts: ISO (2026-10-15, with optional time/T suffix), US slash/dash
 * (10/15/2026, 10-15-2026, 1/5/26). Two-digit years map to 20YY. Validates the
 * result is a real calendar date (rejects 13/40/2026, 02/30/2026).
 */
export function parseLooseDateToIso(raw: string): string | null {
  const s = raw.trim();
  if (s === "") return null;

  // ISO first (optionally with a T/space time suffix).
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
  if (iso) {
    return validIsoOrNull(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  // US M/D/Y or M-D-Y.
  const us = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  if (us) {
    let year = Number(us[3]);
    if (year < 100) year += 2000;
    return validIsoOrNull(year, Number(us[1]), Number(us[2]));
  }

  return null;
}

function validIsoOrNull(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Round-trip through UTC to reject overflow (e.g. Feb 30 → Mar 2).
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Parse a loose time cell to HH:MM:SS (24h), or null if empty/unreadable.
 * Accepts 24h (9:00, 09:00, 13:45:30) and 12h (9:00 AM, 1:45 pm).
 */
export function normalizeTime(raw: string): string | null {
  const s = raw.trim();
  if (s === "") return null;

  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
  if (!m) return null;

  let hour = Number(m[1]);
  const min = Number(m[2]);
  const sec = m[3] ? Number(m[3]) : 0;
  const mer = m[4]?.toLowerCase();

  if (min > 59 || sec > 59) return null;
  if (mer) {
    if (hour < 1 || hour > 12) return null;
    if (mer === "pm" && hour !== 12) hour += 12;
    if (mer === "am" && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }

  const hh = String(hour).padStart(2, "0");
  const mm = String(min).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function truncateReason(s: string): string | null {
  const t = s.trim();
  if (t === "") return null;
  return t.length > 200 ? t.slice(0, 197) + "…" : t;
}

// -----------------------------------------------------------------------------
// Rows → candidates
// -----------------------------------------------------------------------------

/**
 * Turn parsed rows into import candidates under a column mapping. Rows with an
 * unreadable/absent date become issues (the only disqualifying failure). Times
 * degrade gracefully: a row whose times don't both parse to a valid window
 * becomes a whole-day block rather than a hard error (Lock 22 forgiveness —
 * a venue blocking a date by the day is the safe default).
 */
export function rowsToCandidates(
  headers: string[],
  rows: string[][],
  mapping: CsvMapping,
): { candidates: CsvCandidate[]; issues: CsvRowIssue[] } {
  const colIndex = (header: string | null): number =>
    header === null ? -1 : headers.indexOf(header);

  const dateCol = colIndex(mapping.blocked_date);
  const startCol = colIndex(mapping.start_time);
  const endCol = colIndex(mapping.end_time);
  const reasonCol = colIndex(mapping.reason);

  const candidates: CsvCandidate[] = [];
  const issues: CsvRowIssue[] = [];

  rows.forEach((row, i) => {
    const rowNumber = i + 2; // +1 for 0-index, +1 for the header line
    const cell = (idx: number): string => (idx >= 0 ? (row[idx] ?? "") : "");

    if (dateCol < 0) {
      issues.push({ rowNumber, reason: "No date column mapped.", raw: rowSnippet(row) });
      return;
    }

    const blockedDate = parseLooseDateToIso(cell(dateCol));
    if (blockedDate === null) {
      issues.push({
        rowNumber,
        reason: `Couldn't read a date from "${cell(dateCol).trim()}".`,
        raw: rowSnippet(row),
      });
      return;
    }

    const startTime = normalizeTime(cell(startCol));
    const endTime = normalizeTime(cell(endCol));
    // Keep a partial-day window only when both ends parse and end > start;
    // otherwise fall back to a whole-day block.
    const partialOk = startTime !== null && endTime !== null && endTime > startTime;

    candidates.push({
      blockedDate,
      startTime: partialOk ? startTime : null,
      endTime: partialOk ? endTime : null,
      reason: reasonCol >= 0 ? truncateReason(cell(reasonCol)) : null,
    });
  });

  return { candidates, issues };
}

function rowSnippet(row: string[]): string {
  const joined = row.join(", ");
  return joined.length > 80 ? joined.slice(0, 77) + "…" : joined;
}

/**
 * Deterministic external key for a csv-imported block. Re-uploading the same
 * file produces identical source_refs, so the dedup unique index on
 * (venue_tenant_id, venue_space_id, blocked_date, source, source_ref) makes
 * commit idempotent. Distinct time windows on the same date stay distinct.
 */
export function csvSourceRef(c: CsvCandidate): string {
  return `csv:${c.blockedDate}:${c.startTime ?? ""}-${c.endTime ?? ""}`;
}

/** Full processing pass used by the upload action (parse → map → candidates). */
export function processCsv(text: string, mapping?: CsvMapping): CsvProcessOutcome {
  const { headers, rows } = parseCsvText(text);
  const suggestedMapping = autoDetectMapping(headers);
  const effective = mapping ?? suggestedMapping;
  const { candidates, issues } = rowsToCandidates(headers, rows, effective);
  return {
    headers,
    suggestedMapping,
    totalDataRows: rows.length,
    candidates,
    issues,
  };
}
