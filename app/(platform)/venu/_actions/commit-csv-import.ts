"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import {
  processCsv,
  csvSourceRef,
  type CsvMapping,
  type CsvCandidate,
} from "@/lib/venu/csv-import-shared";

/**
 * Commit a CSV import (venue-calendar arc Session C). Re-processes the same
 * (csvText, mapping) the preview saw — never trusts client-sent candidates —
 * then bulk-inserts the valid rows with source='csv_import'.
 *
 * Idempotency: each candidate gets a deterministic source_ref (csvSourceRef),
 * so re-uploading the same file produces the same keys. Rather than rely on
 * ON CONFLICT inference (idx_vab_dedup is a COALESCE *expression* index that
 * supabase-js can't target via a plain column list), we pre-filter against the
 * existing csv_import source_refs for this (tenant, space) slot and insert only
 * the new ones. The unique index remains the backstop for a concurrent double
 * submit (caught as 23505 and reported as already-imported).
 *
 * Manual blocks are NOT touched: csv_import and manual stack as distinct
 * sources. A date blocked by both is simply blocked — no overwrite either way.
 */

const MAX_TEXT_BYTES = 1_000_000;
const MAX_ROWS = 5_000;
const INSERT_CHUNK = 500;

export type CommitCsvInput = {
  csvText: string;
  mapping: CsvMapping;
  venueSpaceId: string | null;
};

export type CommitCsvResult =
  | { ok: true; inserted: number; skippedExisting: number; total: number }
  | { ok: false; error: string };

export async function commitCsvImport(
  input: CommitCsvInput,
): Promise<CommitCsvResult> {
  if (!input.csvText || input.csvText.length > MAX_TEXT_BYTES) {
    return { ok: false, error: "That file looked empty or too large." };
  }
  if (input.mapping.blocked_date === null) {
    return { ok: false, error: "Pick which column holds the date first." };
  }

  const venue = await getCurrentVenue();
  if (!venue) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { candidates } = processCsv(input.csvText, input.mapping);
  if (candidates.length === 0) {
    return { ok: false, error: "No valid dates to import." };
  }
  if (candidates.length > MAX_ROWS) {
    return { ok: false, error: `Too many rows to import (max ${MAX_ROWS}).` };
  }

  // Collapse intra-file duplicates by source_ref (same date+window twice).
  const byRef = new Map<string, CsvCandidate>();
  for (const c of candidates) {
    const ref = csvSourceRef(c);
    if (!byRef.has(ref)) byRef.set(ref, c);
  }
  const total = byRef.size;

  // Pre-filter against already-imported refs on this (tenant, space) slot so
  // re-upload is idempotent without ON CONFLICT.
  const existingRefs = await fetchExistingCsvRefs(
    supabase,
    venue.tenantId,
    input.venueSpaceId,
    [...byRef.keys()],
  );

  const toInsert: CsvCandidate[] = [];
  for (const [ref, c] of byRef) {
    if (!existingRefs.has(ref)) toInsert.push(c);
  }
  const skippedExisting = total - toInsert.length;

  if (toInsert.length === 0) {
    return { ok: true, inserted: 0, skippedExisting, total };
  }

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
    const chunk = toInsert.slice(i, i + INSERT_CHUNK);
    const rows = chunk.map((c) => ({
      venue_tenant_id: venue.tenantId,
      venue_space_id: input.venueSpaceId,
      blocked_date: c.blockedDate,
      start_time: c.startTime,
      end_time: c.endTime,
      reason: c.reason,
      source: "csv_import" as const,
      source_ref: csvSourceRef(c),
      created_by: user.id,
    }));
    const { data, error } = await supabase
      .from("venue_availability_blocks")
      .insert(rows)
      .select("id");

    if (error) {
      // 23505 = a concurrent submit beat us to some of these refs. Treat the
      // rest as already-imported rather than hard-failing the whole batch.
      if (error.code === "23505") {
        return {
          ok: true,
          inserted,
          skippedExisting: total - inserted,
          total,
        };
      }
      return { ok: false, error: error.message };
    }
    inserted += data?.length ?? 0;
  }

  revalidatePath("/venu/availability");
  revalidatePath("/venu/discover");
  return { ok: true, inserted, skippedExisting, total };
}

async function fetchExistingCsvRefs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venueTenantId: string,
  venueSpaceId: string | null,
  refs: string[],
): Promise<Set<string>> {
  const found = new Set<string>();
  // Chunk the IN list so a large re-upload doesn't build an unwieldy query.
  for (let i = 0; i < refs.length; i += INSERT_CHUNK) {
    const chunk = refs.slice(i, i + INSERT_CHUNK);
    let query = supabase
      .from("venue_availability_blocks")
      .select("source_ref")
      .eq("venue_tenant_id", venueTenantId)
      .eq("source", "csv_import")
      .in("source_ref", chunk);
    query =
      venueSpaceId === null
        ? query.is("venue_space_id", null)
        : query.eq("venue_space_id", venueSpaceId);
    const { data } = await query;
    for (const r of data ?? []) {
      const ref = (r as Record<string, unknown>).source_ref as string | null;
      if (ref) found.add(ref);
    }
  }
  return found;
}
