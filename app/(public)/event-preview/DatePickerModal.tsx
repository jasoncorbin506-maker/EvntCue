"use client";

import { useEffect, useMemo, useState } from "react";
import s from "./preview.module.css";

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

type Props = {
  open: boolean;
  selectedIso: string;
  onPick: (iso: string) => void;
  onClose: () => void;
};

export function DatePickerModal(props: Props) {
  if (!props.open) return null;
  return <DatePickerCard {...props} />;
}

/**
 * Form state lives in the inner card so each open mounts fresh — anchored on
 * the currently selected date — without needing setState-in-effect to re-sync.
 */
function DatePickerCard({ selectedIso, onPick, onClose }: Props) {
  const today = useMemo(() => midnight(new Date()), []);
  const todayIso = useMemo(
    () => toIso(today.getFullYear(), today.getMonth(), today.getDate()),
    [today],
  );

  const initial = useMemo(() => {
    const d = new Date(selectedIso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return { year: today.getFullYear(), month: today.getMonth() };
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [selectedIso, today]);

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const maxYear = today.getFullYear() + 5;
  const minYear = today.getFullYear();
  const canPrev = !(viewYear === minYear && viewMonth === today.getMonth());
  const canNext = !(viewYear === maxYear && viewMonth === 11);

  function nav(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    if (y < minYear || (y === minYear && m < today.getMonth())) return;
    if (y > maxYear) return;
    setViewMonth(m);
    setViewYear(y);
  }

  function quick(daysAhead: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    onPick(toIso(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  function backdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

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
    <div className={s.dpModal} onClick={backdrop} role="dialog" aria-modal="true">
      <div className={s.dpCard}>
        <div className={s.dpHead}>
          <div className={s.dpTitle}>Choose your date</div>
          <button
            type="button"
            className={s.dpClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className={s.dpControls}>
          <select
            className={s.dpSelect}
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            aria-label="Month"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            className={s.dpSelect}
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            aria-label="Year"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className={s.dpNav}>
          <button
            type="button"
            className={s.dpNavBtn}
            onClick={() => nav(-1)}
            disabled={!canPrev}
            aria-label="Previous month"
          >
            ‹
          </button>
          <div className={s.dpNavLabel}>
            {MONTHS[viewMonth]} {viewYear}
          </div>
          <button
            type="button"
            className={s.dpNavBtn}
            onClick={() => nav(1)}
            disabled={!canNext}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <div className={s.dpWeekdays}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className={s.dpWd}>{d}</div>
          ))}
        </div>
        <div className={s.dpGrid}>
          {cells.map((cell, i) => {
            if (cell.day === null) return <div key={i} className={`${s.dpDay} ${s.dpDayEmpty}`} />;
            const isToday = cell.iso === todayIso;
            const isSelected = cell.iso === selectedIso;
            const cls = [
              s.dpDay,
              cell.isPast ? s.dpDayPast : "",
              isToday ? s.dpDayToday : "",
              isSelected ? s.dpDaySelected : "",
            ].filter(Boolean).join(" ");
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={cell.isPast}
                onClick={() => cell.iso && onPick(cell.iso)}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
        <div className={s.dpQuick}>
          <button type="button" className={s.dpQuickPill} onClick={() => quick(30)}>
            +30 days
          </button>
          <button type="button" className={s.dpQuickPill} onClick={() => quick(90)}>
            +3 months
          </button>
          <button type="button" className={s.dpQuickPill} onClick={() => quick(180)}>
            +6 months
          </button>
          <button type="button" className={s.dpQuickPill} onClick={() => quick(365)}>
            +1 year
          </button>
        </div>
      </div>
    </div>
  );
}
