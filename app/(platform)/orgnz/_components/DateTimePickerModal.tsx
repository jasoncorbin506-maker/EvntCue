"use client";

import { useEffect, useMemo, useState } from "react";
import s from "../orgnz.module.css";

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
  selectedDateIso: string;
  selectedTime: string | null;
  /**
   * Allow picking past dates. Defaults to false (forward-only). True for
   * past-event editing flows (rarely needed for timeline planning, but
   * here as an escape hatch).
   */
  allowPast?: boolean;
  /** Bottom-anchor the time row with this label. Default: "Time (optional)". */
  timeLabel?: string;
  onConfirm: (iso: string, time: string | null) => void;
  onClose: () => void;
};

export function DateTimePickerModal(props: Props) {
  if (!props.open) return null;
  return <Card {...props} />;
}

function Card({ selectedDateIso, selectedTime, allowPast, timeLabel, onConfirm, onClose }: Props) {
  const today = useMemo(() => midnight(new Date()), []);
  const todayIso = useMemo(
    () => toIso(today.getFullYear(), today.getMonth(), today.getDate()),
    [today],
  );

  const initialDate = useMemo(() => {
    const d = new Date(selectedDateIso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return { year: today.getFullYear(), month: today.getMonth() };
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [selectedDateIso, today]);

  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);
  const [pickedIso, setPickedIso] = useState(selectedDateIso);
  const [time, setTime] = useState<string>(selectedTime?.slice(0, 5) ?? "");

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
  const minYear = allowPast ? today.getFullYear() - 5 : today.getFullYear();

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
    if (y < minYear) return;
    if (!allowPast && y === minYear && m < today.getMonth()) return;
    if (y > maxYear) return;
    setViewMonth(m);
    setViewYear(y);
  }

  function quick(daysAhead: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const iso = toIso(d.getFullYear(), d.getMonth(), d.getDate());
    setPickedIso(iso);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function backdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function confirm() {
    const t = time && /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : null;
    onConfirm(pickedIso, t);
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
          <div className={s.dpTitle}>Pick date {timeLabel ? "& time" : ""}</div>
          <button type="button" className={s.dpClose} onClick={onClose} aria-label="Close">×</button>
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
          <button type="button" className={s.dpNavBtn} onClick={() => nav(-1)} aria-label="Previous month">‹</button>
          <div className={s.dpNavLabel}>{MONTHS[viewMonth]} {viewYear}</div>
          <button type="button" className={s.dpNavBtn} onClick={() => nav(1)} aria-label="Next month">›</button>
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
            const isSelected = cell.iso === pickedIso;
            const disabled = !allowPast && cell.isPast;
            const cls = [
              s.dpDay,
              disabled ? s.dpDayPast : "",
              isToday ? s.dpDayToday : "",
              isSelected ? s.dpDaySelected : "",
            ].filter(Boolean).join(" ");
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={disabled}
                onClick={() => cell.iso && setPickedIso(cell.iso)}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
        <div className={s.dpQuick}>
          <button type="button" className={s.dpQuickPill} onClick={() => quick(0)}>Today</button>
          <button type="button" className={s.dpQuickPill} onClick={() => quick(1)}>Tomorrow</button>
          <button type="button" className={s.dpQuickPill} onClick={() => quick(7)}>+1 week</button>
          <button type="button" className={s.dpQuickPill} onClick={() => quick(30)}>+30 days</button>
        </div>

        <div className={s.dpTimeRow}>
          <label className={s.dpTimeLabel}>{timeLabel ?? "Time (optional)"}</label>
          <input
            type="time"
            className={s.dpTimeInput}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          {time && (
            <button
              type="button"
              className={s.dpTimeClear}
              onClick={() => setTime("")}
              aria-label="Clear time"
            >Clear</button>
          )}
        </div>

        <div className={s.dpActions}>
          <button type="button" className={s.dpCancel} onClick={onClose}>Cancel</button>
          <button type="button" className={s.dpConfirm} onClick={confirm}>Save</button>
        </div>
      </div>
    </div>
  );
}
