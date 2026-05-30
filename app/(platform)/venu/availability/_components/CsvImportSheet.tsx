"use client";

import { useState, useTransition } from "react";
import { uploadCsvImport, type CsvUploadPreview } from "../../_actions/upload-csv-import";
import { commitCsvImport } from "../../_actions/commit-csv-import";
import {
  CSV_COLUMN_KEYS,
  CSV_COLUMN_LABELS,
  type CsvColumnKey,
  type CsvMapping,
} from "@/lib/venu/csv-import-shared";
import type { VenueSpace } from "@/lib/venu/availability-shared";
import s from "./CsvImportSheet.module.css";

/**
 * Three-step CSV import wizard (venue-calendar arc Session C):
 *   1. Upload   — pick a .csv/.tsv + (if multi-space) the space it applies to.
 *   2. Map      — confirm/override which column is the date / times / note.
 *   3. Preview  — dry-run counts + sample + warnings, then commit.
 *
 * File text is read client-side and handed to the server actions; the server
 * is the single source of truth for parsing + validation (the wizard never
 * trusts its own preview at commit time — see commit-csv-import.ts).
 *
 * Mirrors SubscribeCalendarFeedSheet's drawer chrome + bay-blue accents.
 */

type Step = "upload" | "map" | "preview";

type Props = {
  spaces: VenueSpace[];
  onClose: () => void;
};

function timeLabel(start: string | null, end: string | null): string {
  if (!start || !end) return "All day";
  return `${start.slice(0, 5)}–${end.slice(0, 5)}`;
}

export function CsvImportSheet({ spaces, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("upload");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [spaceId, setSpaceId] = useState<string | "">("");
  const [mapping, setMapping] = useState<CsvMapping | null>(null);
  const [preview, setPreview] = useState<CsvUploadPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const venueSpaceId = spaceId === "" ? null : spaceId;

  async function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setFileName(file.name);
  }

  function runPreview(useMapping: CsvMapping | undefined, nextStep: Step) {
    setError(null);
    startTransition(async () => {
      const res = await uploadCsvImport({ csvText, mapping: useMapping, venueSpaceId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPreview(res);
      setMapping(useMapping ?? res.suggestedMapping);
      setStep(nextStep);
    });
  }

  function handleCommit() {
    if (!mapping) return;
    setError(null);
    startTransition(async () => {
      const res = await commitCsvImport({ csvText, mapping, venueSpaceId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const skipped =
        res.skippedExisting > 0 ? ` (${res.skippedExisting} already on your calendar)` : "";
      setDone(
        res.inserted === 0
          ? `Nothing new to add${skipped}.`
          : `Imported ${res.inserted} ${res.inserted === 1 ? "date" : "dates"}${skipped}.`,
      );
      setTimeout(onClose, 1600);
    });
  }

  function updateMapping(key: CsvColumnKey, header: string) {
    setMapping((prev) => {
      const base: CsvMapping = prev ?? {
        blocked_date: null,
        start_time: null,
        end_time: null,
        reason: null,
      };
      return { ...base, [key]: header === "" ? null : header };
    });
  }

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label="Import from CSV">
        <div className={s.header}>
          <div>
            <div className={s.title}>Import from CSV</div>
            <div className={s.subtitle}>
              {step === "upload" && "Upload a spreadsheet of booked dates"}
              {step === "map" && "Tell us which column is which"}
              {step === "preview" && "Review before adding to your calendar"}
            </div>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={s.steps}>
          <span className={step === "upload" ? s.stepOn : s.step}>1 · Upload</span>
          <span className={step === "map" ? s.stepOn : s.step}>2 · Map</span>
          <span className={step === "preview" ? s.stepOn : s.step}>3 · Review</span>
        </div>

        {step === "upload" && (
          <>
            <label className={s.dropzone}>
              <input
                type="file"
                accept=".csv,.tsv,text/csv,text/tab-separated-values"
                className={s.fileInput}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <span className={s.dropTitle}>
                {fileName ? fileName : "Choose a .csv or .tsv file"}
              </span>
              <span className={s.dropHint}>
                Exported from Tripleseat, Honeybook, Google Calendar, or any spreadsheet
              </span>
            </label>

            {spaces.length > 1 && (
              <div className={s.fieldRow}>
                <label className={s.fieldLbl} htmlFor="csv-space">
                  Space
                </label>
                <select
                  id="csv-space"
                  className={s.input}
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                >
                  <option value="">Whole venue</option>
                  {spaces.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && <div className={s.errMsg}>{error}</div>}

            <div className={s.footer}>
              <button type="button" className={s.btn} onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.btnPrimary}`}
                disabled={pending || csvText.trim() === ""}
                onClick={() => runPreview(undefined, "map")}
              >
                {pending ? "Reading…" : "Next"}
              </button>
            </div>
          </>
        )}

        {step === "map" && preview && (
          <>
            <div className={s.mapHint}>
              We matched these automatically — change any that look wrong. Only the
              date is required.
            </div>
            {CSV_COLUMN_KEYS.map((key) => (
              <div key={key} className={s.fieldRow}>
                <label className={s.fieldLbl} htmlFor={`map-${key}`}>
                  {CSV_COLUMN_LABELS[key]}
                  {key === "blocked_date" && <span className={s.req}> *</span>}
                </label>
                <select
                  id={`map-${key}`}
                  className={s.input}
                  value={mapping?.[key] ?? ""}
                  onChange={(e) => updateMapping(key, e.target.value)}
                >
                  <option value="">— none —</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {error && <div className={s.errMsg}>{error}</div>}

            <div className={s.footer}>
              <button type="button" className={s.btn} onClick={() => setStep("upload")}>
                Back
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.btnPrimary}`}
                disabled={pending || !mapping || mapping.blocked_date === null}
                onClick={() => mapping && runPreview(mapping, "preview")}
              >
                {pending ? "Checking…" : "Preview"}
              </button>
            </div>
          </>
        )}

        {step === "preview" && preview && (
          <>
            <div className={s.summaryRow}>
              <div className={s.summaryStat}>
                <div className={s.statNum}>{preview.validCount}</div>
                <div className={s.statLbl}>ready to add</div>
              </div>
              {preview.issueCount > 0 && (
                <div className={s.summaryStat}>
                  <div className={`${s.statNum} ${s.statWarn}`}>{preview.issueCount}</div>
                  <div className={s.statLbl}>skipped (no date)</div>
                </div>
              )}
              {preview.conflictCount > 0 && (
                <div className={s.summaryStat}>
                  <div className={s.statNum}>{preview.conflictCount}</div>
                  <div className={s.statLbl}>already blocked</div>
                </div>
              )}
            </div>

            {preview.validCount === 0 ? (
              <div className={s.emptyPreview}>
                No readable dates in this file. Go back and check the date column.
              </div>
            ) : (
              <div className={s.sampleTable}>
                {preview.sample.map((c, i) => (
                  <div key={i} className={s.sampleRow}>
                    <span className={s.sampleDate}>{c.blockedDate}</span>
                    <span className={s.sampleTime}>{timeLabel(c.startTime, c.endTime)}</span>
                    <span className={s.sampleReason}>{c.reason ?? "—"}</span>
                  </div>
                ))}
                {preview.validCount > preview.sample.length && (
                  <div className={s.sampleMore}>
                    + {preview.validCount - preview.sample.length} more
                  </div>
                )}
              </div>
            )}

            {preview.issues.length > 0 && (
              <details className={s.issues}>
                <summary>{preview.issueCount} rows skipped</summary>
                {preview.issues.map((iss) => (
                  <div key={iss.rowNumber} className={s.issueRow}>
                    <b>Line {iss.rowNumber}:</b> {iss.reason}
                  </div>
                ))}
              </details>
            )}

            {error && <div className={s.errMsg}>{error}</div>}
            {done && <div className={s.okMsg}>{done}</div>}

            <div className={s.footer}>
              <button
                type="button"
                className={s.btn}
                onClick={() => setStep("map")}
                disabled={pending || done !== null}
              >
                Back
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.btnPrimary}`}
                disabled={pending || preview.validCount === 0 || done !== null}
                onClick={handleCommit}
              >
                {pending
                  ? "Importing…"
                  : `Import ${preview.validCount} ${preview.validCount === 1 ? "date" : "dates"}`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
