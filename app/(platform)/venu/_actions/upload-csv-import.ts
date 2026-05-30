"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import { processCsv, type CsvMapping, type CsvCandidate } from "@/lib/venu/csv-import-shared";

/**
 * Dry-run preview for the CSV import wizard (venue-calendar arc Session C,
 * scope item B). Parses + maps + validates the uploaded file and reports what
 * WOULD import — it never writes. The commit step (commit-csv-import.ts)
 * re-processes the same (csvText, mapping) server-side so the client can't
 * smuggle tampered candidates past validation.
 *
 * "Conflicts" here are informational only: a CSV date that already has a
 * manual block on the same (space) slot. They still import — manual and
 * csv_import stack as distinct sources (the date is just blocked by both).
 * We surface the count so the operator isn't surprised.
 */

const MAX_TEXT_BYTES = 1_000_000; // ~1MB upload ceiling
const MAX_ROWS = 5_000;
const SAMPLE_LIMIT = 10;
const ISSUE_LIMIT = 25;

export type CsvUploadInput = {
  csvText: string;
  /** Explicit column mapping; omit to use auto-detection. */
  mapping?: CsvMapping;
  venueSpaceId: string | null;
};

export type CsvUploadPreview = {
  ok: true;
  headers: string[];
  suggestedMapping: CsvMapping;
  totalDataRows: number;
  validCount: number;
  /** First few valid candidates for the preview table. */
  sample: CsvCandidate[];
  issues: { rowNumber: number; reason: string; raw: string }[];
  issueCount: number;
  /** Valid candidates whose date already has a manual block on this slot. */
  conflictCount: number;
};

export type CsvUploadResult = CsvUploadPreview | { ok: false; error: string };

export async function uploadCsvImport(
  input: CsvUploadInput,
): Promise<CsvUploadResult> {
  if (!input.csvText || input.csvText.trim() === "") {
    return { ok: false, error: "That file looked empty." };
  }
  if (input.csvText.length > MAX_TEXT_BYTES) {
    return { ok: false, error: "That file is too large (max 1MB)." };
  }

  const venue = await getCurrentVenue();
  if (!venue) return { ok: false, error: "Not signed in." };

  const outcome = processCsv(input.csvText, input.mapping);

  if (outcome.headers.length === 0) {
    return { ok: false, error: "Couldn't find any columns in that file." };
  }
  if (outcome.totalDataRows > MAX_ROWS) {
    return { ok: false, error: `That file has too many rows (max ${MAX_ROWS}).` };
  }

  const effectiveMapping = input.mapping ?? outcome.suggestedMapping;
  if (effectiveMapping.blocked_date === null) {
    return {
      ok: false,
      error: "Pick which column holds the date — we couldn't detect one.",
    };
  }

  const conflictCount = await countManualConflicts(
    venue.tenantId,
    input.venueSpaceId,
    outcome.candidates,
  );

  return {
    ok: true,
    headers: outcome.headers,
    suggestedMapping: outcome.suggestedMapping,
    totalDataRows: outcome.totalDataRows,
    validCount: outcome.candidates.length,
    sample: outcome.candidates.slice(0, SAMPLE_LIMIT),
    issues: outcome.issues.slice(0, ISSUE_LIMIT),
    issueCount: outcome.issues.length,
    conflictCount,
  };
}

async function countManualConflicts(
  venueTenantId: string,
  venueSpaceId: string | null,
  candidates: CsvCandidate[],
): Promise<number> {
  const dates = [...new Set(candidates.map((c) => c.blockedDate))];
  if (dates.length === 0) return 0;

  const supabase = await createClient();
  let query = supabase
    .from("venue_availability_blocks")
    .select("blocked_date")
    .eq("venue_tenant_id", venueTenantId)
    .eq("source", "manual")
    .in("blocked_date", dates);
  query =
    venueSpaceId === null
      ? query.is("venue_space_id", null)
      : query.eq("venue_space_id", venueSpaceId);

  const { data } = await query;
  if (!data || data.length === 0) return 0;

  const manualDates = new Set(
    data.map((r) => (r as Record<string, unknown>).blocked_date as string),
  );
  return candidates.filter((c) => manualDates.has(c.blockedDate)).length;
}
