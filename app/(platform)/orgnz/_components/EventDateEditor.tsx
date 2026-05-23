"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { TimePicker } from "@/app/_components/TimePicker";
import type {
  CascadeDiff,
  CascadePreviewItem,
} from "@/lib/events/cascade-preview";
import type { EventTimingFields } from "@/lib/events/timing";
import {
  updateEventDateAction,
  type PreviewSignals,
} from "../_actions/update-event-date";
import s from "./EventDateEditor.module.css";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(year: number, month0: number, day: number): string {
  return `${year}-${pad(month0 + 1)}-${pad(day)}`;
}

function midnight(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/**
 * Inline calendar grid. Replaces native <input type="date"> which is
 * unusable on desktop Safari (segment-by-segment, same problem as the
 * time input). Mirrors the DatePickerModal pattern from /event-preview.
 *
 * `value` is "YYYY-MM-DD". `onChange` fires when the user picks a day.
 */
function DateGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const today = useMemo(() => midnight(new Date()), []);
  const todayIso = useMemo(
    () => toIso(today.getFullYear(), today.getMonth(), today.getDate()),
    [today],
  );

  const initial = useMemo(() => {
    const d = new Date(value + "T00:00:00");
    if (Number.isNaN(d.getTime())) {
      return { year: today.getFullYear(), month: today.getMonth() };
    }
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [value, today]);

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  // Re-sync if `value` changes externally (e.g., parent reset)
  useEffect(() => {
    setViewYear(initial.year);
    setViewMonth(initial.month);
  }, [initial.year, initial.month]);

  const maxYear = today.getFullYear() + 5;
  const minYear = today.getFullYear();

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: Array<{ day: number | null; iso: string | null; isPast: boolean }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, iso: null, isPast: false });
  for (let d = 1; d <= lastDate; d++) {
    const cellDate = new Date(viewYear, viewMonth, d);
    const iso = toIso(viewYear, viewMonth, d);
    cells.push({ day: d, iso, isPast: cellDate < today });
  }

  const yearOptions: number[] = [];
  for (let y = minYear; y <= maxYear; y++) yearOptions.push(y);

  return (
    <div className={s.dateGrid}>
      <div className={s.dateGridControls}>
        <select
          className={s.dateGridSelect}
          value={viewMonth}
          onChange={(e) => setViewMonth(Number(e.target.value))}
          aria-label="Month"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <select
          className={s.dateGridSelect}
          value={viewYear}
          onChange={(e) => setViewYear(Number(e.target.value))}
          aria-label="Year"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className={s.dateGridWeekdays}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className={s.dateGridWd}>
            {d}
          </div>
        ))}
      </div>
      <div className={s.dateGridDays}>
        {cells.map((cell, i) => {
          if (cell.day === null) {
            return <div key={i} className={`${s.dateGridDay} ${s.dateGridDayEmpty}`} />;
          }
          const isToday = cell.iso === todayIso;
          const isSelected = cell.iso === value;
          const cls = [
            s.dateGridDay,
            cell.isPast ? s.dateGridDayPast : "",
            isToday ? s.dateGridDayToday : "",
            isSelected ? s.dateGridDaySelected : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={cell.isPast}
              onClick={() => cell.iso && onChange(cell.iso)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * F2.b cascade preview pane — the trust-critical surface.
 *
 * Three-step state machine:
 *   1. "form"      — date + time + reason fields. User edits values.
 *   2. "preview"   — server computed the cascade diff. UI renders two
 *                    lists (auto-shift relative items + absolute items
 *                    needing approval, with per-row "shift it" checkbox).
 *   3. "committed" — brief success state then auto-close.
 *
 * Empty-diff fast path: if the cascade is empty (nothing depends on this
 * event's date yet), skip the preview pane and commit straight from form
 * → committed.
 *
 * Per F2.b + F3.b in
 * decisions-log/2026-05-23-event-start-time-architecture.md.
 * Jason: "severe warnings of cascading changes."
 *
 * Per F4.b — all timestamp displays use viewer-local TZ. Cascade preview
 * rows show old → new in viewer-local with line-through on old.
 */

export type EventDateEditorProps = {
  open: boolean;
  eventId: string;
  current: EventTimingFields;
  onClose: () => void;
};

type Step = "form" | "preview" | "committed";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function EventDateEditor({
  open,
  eventId,
  current,
  onClose,
}: EventDateEditorProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("events.timing.editor");
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);

  // Form state — seeded from current
  const [newDate, setNewDate] = useState(current.start_date);
  const [newTime, setNewTime] = useState<string | null>(current.start_time);
  const [reason, setReason] = useState("");

  // Preview state
  const [diff, setDiff] = useState<CascadeDiff | null>(null);
  const [signals, setSignals] = useState<PreviewSignals | null>(null);
  const [approvedKeys, setApprovedKeys] = useState<Set<string>>(new Set());

  // SSR-safe mounted gate so createPortal only fires client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const intlLocale = locale === "es" ? "es-MX" : "en-US";
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    [intlLocale],
  );

  if (!open || !mounted) return null;

  const noChange =
    newDate === current.start_date && newTime === current.start_time;

  const close = () => {
    // Reset internal state so re-open is fresh
    setStep("form");
    setError(null);
    setDiff(null);
    setSignals(null);
    setApprovedKeys(new Set());
    setNewDate(current.start_date);
    setNewTime(current.start_time);
    setReason("");
    onClose();
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !pending) close();
  };

  const handlePreview = () => {
    if (noChange) return;
    setError(null);
    startTransition(async () => {
      const result = await updateEventDateAction({
        mode: "preview",
        eventId,
        newStartDate: newDate,
        newStartTime: newTime,
        reason: reason.trim() || undefined,
      });
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      if (result.ok === "preview") {
        // Per Jason's "we promised warnings, did not deliver" feedback —
        // ALWAYS show the preview/confirmation pane, even when the cascade
        // is empty. The user explicitly confirms every date change. The
        // pane shows the date-change summary on top + Cue lead-time
        // warning (if applicable) + booked-vendor notice (if applicable)
        // + cascade lists or empty-cascade note.
        setDiff(result.diff);
        setSignals(result.signals);
        setStep("preview");
      }
    });
  };

  const commit = async (
    approvedShifts: ReadonlyArray<{
      source: CascadePreviewItem["source"];
      key: string;
      newAtMillis: number;
    }>,
  ) => {
    setError(null);
    const result = await updateEventDateAction({
      mode: "commit",
      eventId,
      newStartDate: newDate,
      newStartTime: newTime,
      approvedAbsoluteShifts: approvedShifts,
      reason: reason.trim() || undefined,
    });
    if (result.ok === false) {
      setError(result.error);
      return;
    }
    if (result.ok === "committed") {
      setStep("committed");
      // Brief confirmation then close + refresh server data
      setTimeout(() => {
        router.refresh();
        close();
      }, 1400);
    }
  };

  const handleApply = () => {
    if (!diff || pending) return;
    startTransition(async () => {
      const approvedShifts = diff.needsApproval
        .filter((item) => approvedKeys.has(item.key))
        .map((item) => ({
          source: item.source,
          key: item.key,
          newAtMillis: item.newAtMillis,
        }));
      await commit(approvedShifts);
    });
  };

  const toggleApproved = (key: string) => {
    setApprovedKeys((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalItems = diff
    ? diff.autoShift.length + diff.needsApproval.length
    : 0;

  return createPortal(
    <div
      className={s.overlay}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className={s.modal}>
        <div className={s.header}>
          <div className={s.title}>
            {step === "form" &&
              t.rich("titleEdit", { em: (chunks) => <em>{chunks}</em> })}
            {step === "preview" &&
              t.rich("titleCascades", { em: (chunks) => <em>{chunks}</em> })}
            {step === "committed" && t("titleSaved")}
          </div>
          <button
            type="button"
            className={s.close}
            onClick={close}
            disabled={pending}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={s.body}>
          {step === "form" && (
            <>
              <div className={s.warning}>
                <span className={s.warningIcon}>⚠</span>
                <span>{t("warningForm")}</span>
              </div>

              <div className={s.field}>
                <span className={s.label}>{t("dateLabel")}</span>
                <DateGrid value={newDate} onChange={setNewDate} />
              </div>

              <div className={s.field}>
                <span className={s.label}>{t("timeLabel")}</span>
                <TimePicker
                  value={newTime}
                  onChange={setNewTime}
                  helpText={t("timeHelp")}
                />
              </div>

              <div className={s.field}>
                <label className={s.label} htmlFor="ede-reason">
                  {t("reasonLabel")}
                </label>
                <textarea
                  id="ede-reason"
                  className={s.textarea}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("reasonPlaceholder")}
                  maxLength={500}
                />
              </div>
            </>
          )}

          {step === "preview" && diff && (
            <>
              <div className={s.warning}>
                <span className={s.warningIcon}>⚠</span>
                <span>
                  {totalItems === 0
                    ? t("warningPreviewEmpty")
                    : t("warningPreviewItems", {
                        count: totalItems,
                        plural: totalItems === 1 ? "" : "s",
                      })}
                </span>
              </div>

              {/* Date-change summary card — ALWAYS visible on preview step.
               * Per Jason's "warnings every time" feedback — the user sees
               * exactly what's about to change before they commit, even
               * when there are no dependent items. */}
              <div className={s.summaryCard}>
                <div className={s.summaryLabel}>{t("summaryLabel")}</div>
                <div className={s.summaryRow}>
                  <span className={s.summaryOld}>
                    {fmt.format(
                      new Date(
                        `${current.start_date}T${current.start_time ?? "00:00:00"}`,
                      ),
                    )}
                  </span>
                  <span className={s.summaryArrow}>→</span>
                  <span className={s.summaryNew}>
                    {fmt.format(
                      new Date(`${newDate}T${newTime ?? "00:00:00"}`),
                    )}
                  </span>
                </div>
              </div>

              {/* Cue lead-time warning — surfaces when the new date is
               * tight against the event type's recommended lead months.
               * Per Jason 2026-05-23 ("Cue did not engage with short notice
               * warnings"). */}
              {signals && (signals.leadSeverity === "warn" || signals.leadSeverity === "danger") && (
                <div
                  className={
                    signals.leadSeverity === "danger"
                      ? `${s.cueNote} ${s.cueNoteDanger}`
                      : s.cueNote
                  }
                >
                  <span className={s.cueMark}>✦</span>
                  <div className={s.cueBody}>
                    <div className={s.cueTag}>
                      {signals.leadSeverity === "danger"
                        ? t("cueTagDanger")
                        : t("cueTagWarn")}
                    </div>
                    <div className={s.cueText}>
                      {t(
                        signals.leadSeverity === "danger"
                          ? "cueTextDanger"
                          : "cueTextWarn",
                        {
                          category: signals.categoryKey,
                          recommended: signals.recommendedLeadMonths,
                          actual: signals.monthsUntilNewDate.toFixed(1),
                        },
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Booked-vendor notice — surfaces when there are committed
               * bookings on this event. Vendor notification + re-acceptance
               * is Phase 4 / V-2 work; we surface the gap honestly. */}
              {signals && signals.bookedVendorCount > 0 && (
                <div className={s.vendorNote}>
                  <span className={s.vendorIcon}>⚠</span>
                  <div className={s.vendorBody}>
                    <div className={s.vendorTag}>{t("vendorTag")}</div>
                    <div className={s.vendorText}>
                      {signals.bookedVendorCount === 1
                        ? t.rich("vendorTextSingle", {
                            em: (chunks) => <em>{chunks}</em>,
                          })
                        : t.rich("vendorTextMultiple", {
                            count: signals.bookedVendorCount,
                            em: (chunks) => <em>{chunks}</em>,
                          })}
                    </div>
                  </div>
                </div>
              )}

              {totalItems === 0 && (
                <p className={s.emptyCascadeNote}>{t("emptyCascadeNote")}</p>
              )}

              {diff.autoShift.length > 0 && (
                <div className={s.section}>
                  <div className={s.sectionH}>
                    {t("autoShiftHead", { count: diff.autoShift.length })}
                  </div>
                  <p className={s.sectionDesc}>{t("autoShiftDesc")}</p>
                  <ul className={s.list}>
                    {diff.autoShift.map((item) => (
                      <li
                        key={`${item.source}:${item.key}`}
                        className={`${s.item} ${s.itemAuto}`}
                      >
                        <span className={s.itemLabel}>{item.label}</span>
                        <span className={s.itemTimes}>
                          <span className={s.itemTimeOld}>
                            {fmt.format(new Date(item.oldAtMillis))}
                          </span>
                          <span className={s.itemArrow}>→</span>
                          <span className={s.itemTimeNew}>
                            {fmt.format(new Date(item.newAtMillis))}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {diff.needsApproval.length > 0 && (
                <div className={s.section}>
                  <div className={s.sectionH}>
                    {t("needsApprovalHead", { count: diff.needsApproval.length })}
                  </div>
                  <p className={s.sectionDesc}>{t("needsApprovalDesc")}</p>
                  <ul className={s.list}>
                    {diff.needsApproval.map((item) => {
                      const checked = approvedKeys.has(item.key);
                      return (
                        <li
                          key={`${item.source}:${item.key}`}
                          className={`${s.item} ${s.itemAbs}`}
                        >
                          <label className={s.approveLabel}>
                            <input
                              type="checkbox"
                              className={s.approveCheckbox}
                              checked={checked}
                              onChange={() => toggleApproved(item.key)}
                            />
                            <span className={s.approveBody}>
                              <span className={s.itemLabel}>{item.label}</span>
                              <span className={s.itemTimes}>
                                <span
                                  className={
                                    checked ? s.itemTimeOld : s.itemTimeNew
                                  }
                                >
                                  {fmt.format(new Date(item.oldAtMillis))}
                                </span>
                                {checked && (
                                  <>
                                    <span className={s.itemArrow}>→</span>
                                    <span className={s.itemTimeNew}>
                                      {fmt.format(new Date(item.newAtMillis))}
                                    </span>
                                  </>
                                )}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}

          {step === "committed" && (
            <div className={s.saved}>{t("savedMessage")}</div>
          )}
        </div>

        {error && <div className={s.error}>{error}</div>}

        {step !== "committed" && (
          <div className={s.footer}>
            {step === "form" && (
              <>
                <button
                  type="button"
                  className={s.btnCancel}
                  onClick={close}
                  disabled={pending}
                >
                  {t("btnCancel")}
                </button>
                <button
                  type="button"
                  className={s.btnPrimary}
                  onClick={handlePreview}
                  disabled={pending || noChange}
                >
                  {pending ? t("btnChecking") : t("btnContinue")}
                </button>
              </>
            )}
            {step === "preview" && (
              <>
                <button
                  type="button"
                  className={s.btnCancel}
                  onClick={() => setStep("form")}
                  disabled={pending}
                >
                  {t("btnBack")}
                </button>
                <button
                  type="button"
                  className={s.btnPrimary}
                  onClick={handleApply}
                  disabled={pending}
                >
                  {pending ? t("btnApplying") : t("btnApply")}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Trigger button — rendered inline next to the event date in Hero. Click
 * opens the modal. Self-contained: trigger + modal in one client island.
 */
export function EventDateEditTrigger({
  eventId,
  current,
}: {
  eventId: string;
  current: EventTimingFields;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("events.timing.editor");
  return (
    <>
      <button
        type="button"
        className={s.editTrigger}
        onClick={() => setOpen(true)}
        aria-label={t("triggerEdit")}
      >
        {t("triggerEdit")}
      </button>
      <EventDateEditor
        open={open}
        eventId={eventId}
        current={current}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
