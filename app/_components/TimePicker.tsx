"use client";

import { useMemo, useState } from "react";
import s from "./TimePicker.module.css";

/**
 * TimePicker — F7 placement: lives below the date selector in /event-preview's
 * date modal. Optional field; "All day" chip explicitly sets value to null
 * (per Q3 in decisions-log/2026-05-23-event-start-time-architecture.md).
 *
 * Replaced the native HTML <input type="time"> (2026-05-23) — desktop Safari's
 * native control has segment-by-segment input that users don't realize they
 * have to click individually, leading to silent null-time submits. Choice-
 * architected chips match the rest of the funnel's UX (every other input in
 * /event-preview + /vndr-onboarding is chip- or slider-based; native form
 * controls stick out).
 *
 * Shape:
 *   - Preset chips (5 common event times) + Custom + All day
 *   - Selecting a preset writes a TIMETZ-safe "HH:MM:SS" string
 *   - "Custom" opens a 3-control row below: hour select + minute select +
 *     AM/PM toggle pair
 *   - "All day" sets value to null
 *   - Initial open with value=null → All day chip highlighted (default)
 *   - Initial open with value matching a preset → that preset highlighted
 *   - Initial open with value not matching any preset → no chip highlighted,
 *     custom row auto-expanded showing the value
 */

const PRESETS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "11 AM", value: "11:00:00" },
  { label: "4 PM", value: "16:00:00" },
  { label: "5 PM", value: "17:00:00" },
  { label: "6 PM", value: "18:00:00" },
  { label: "7 PM", value: "19:00:00" },
];

const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;

function toHHMMSS(hour12: number, minute: number, isPm: boolean): string {
  let h = hour12 % 12; // 12 → 0
  if (isPm) h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

type Parsed = { hour12: number; minute: number; isPm: boolean };

function parseHHMMSS(value: string | null): Parsed | null {
  if (!value) return null;
  const m = /^(\d{2}):(\d{2})(:\d{2})?$/.exec(value);
  if (!m) return null;
  const h24 = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (Number.isNaN(h24) || Number.isNaN(minute)) return null;
  const isPm = h24 >= 12;
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, isPm };
}

function valueMatchesPreset(value: string | null): boolean {
  return value !== null && PRESETS.some((p) => p.value === value);
}

export type TimePickerProps = {
  /** "HH:MM:SS" 24h or null = all-day. */
  value: string | null;
  onChange: (next: string | null) => void;
  /** Optional kicker label above the chip row. */
  label?: string;
  /** Optional helper line below the picker. */
  helpText?: string;
};

export function TimePicker({
  value,
  onChange,
  label,
  helpText,
}: TimePickerProps) {
  // Custom row auto-opens when value is non-null but doesn't match a preset
  // (so a returning visit shows the user's custom time directly without an
  // extra click). Otherwise local state controls visibility.
  const valueIsCustom = value !== null && !valueMatchesPreset(value);
  const [customOpenLocal, setCustomOpenLocal] = useState(valueIsCustom);
  const customOpen = customOpenLocal || valueIsCustom;

  // Parsed values for the custom row's controls. Default to 5:00 PM if there's
  // no parseable input — that's the most common event start in our DFW context.
  const parsed: Parsed = useMemo(
    () => parseHHMMSS(value) ?? { hour12: 5, minute: 0, isPm: true },
    [value],
  );

  const selectedPreset = useMemo(
    () => PRESETS.find((p) => p.value === value),
    [value],
  );
  const isAllDay = value === null;

  const handlePreset = (presetValue: string) => {
    onChange(presetValue);
    setCustomOpenLocal(false);
  };

  const handleAllDay = () => {
    onChange(null);
    setCustomOpenLocal(false);
  };

  const handleCustomToggle = () => {
    if (customOpen) {
      // Collapse. If value is already a preset, leave it; otherwise leave it
      // too (user can re-expand to edit).
      setCustomOpenLocal(false);
    } else {
      // Expand. If value is null or matches a preset, that's fine — show
      // current state; user can then change the controls.
      setCustomOpenLocal(true);
    }
  };

  const updateCustom = (next: Partial<Parsed>) => {
    const merged = { ...parsed, ...next };
    onChange(toHHMMSS(merged.hour12, merged.minute, merged.isPm));
  };

  return (
    <div className={s.wrap}>
      {label ? <div className={s.label}>{label}</div> : null}

      <div className={s.chipRow}>
        {PRESETS.map((p) => {
          const on = selectedPreset?.value === p.value;
          return (
            <button
              key={p.value}
              type="button"
              className={`${s.chip} ${on ? s.chipOn : ""}`}
              onClick={() => handlePreset(p.value)}
              aria-pressed={on}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          className={`${s.chip} ${s.chipAllDay} ${isAllDay ? s.chipOn : ""}`}
          onClick={handleAllDay}
          aria-pressed={isAllDay}
        >
          All day
        </button>
      </div>

      <button
        type="button"
        className={s.customToggle}
        onClick={handleCustomToggle}
        aria-expanded={customOpen}
      >
        {customOpen ? "− Hide custom time" : "✎ Pick a custom time"}
      </button>

      {customOpen && (
        <div className={s.customRow}>
          <select
            className={s.customSelect}
            value={parsed.hour12}
            onChange={(e) =>
              updateCustom({ hour12: parseInt(e.target.value, 10) })
            }
            aria-label="Hour"
          >
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <span className={s.customSeparator}>:</span>
          <select
            className={s.customSelect}
            value={parsed.minute}
            onChange={(e) =>
              updateCustom({ minute: parseInt(e.target.value, 10) })
            }
            aria-label="Minute"
          >
            {MINUTE_STEPS.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
          <div className={s.amPmGroup}>
            <button
              type="button"
              className={`${s.amPmBtn} ${!parsed.isPm ? s.amPmBtnOn : ""}`}
              onClick={() => updateCustom({ isPm: false })}
              aria-pressed={!parsed.isPm}
            >
              AM
            </button>
            <button
              type="button"
              className={`${s.amPmBtn} ${parsed.isPm ? s.amPmBtnOn : ""}`}
              onClick={() => updateCustom({ isPm: true })}
              aria-pressed={parsed.isPm}
            >
              PM
            </button>
          </div>
        </div>
      )}

      {helpText ? <div className={s.help}>{helpText}</div> : null}
    </div>
  );
}
