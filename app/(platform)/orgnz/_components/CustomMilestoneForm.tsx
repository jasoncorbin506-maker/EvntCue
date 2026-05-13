"use client";

import { useState } from "react";
import s from "../orgnz.module.css";
import { TRADITIONS } from "@/data/cultural-traditions";
import { addCustomMilestone } from "../_actions/add-custom-milestone";
import { updateCustomMilestone } from "../_actions/update-custom-milestone";
import { showToast } from "../_lib/toast";
import { DateTimePickerModal } from "./DateTimePickerModal";

function formatDateChip(iso: string, time: string | null): string {
  const d = new Date(iso + "T00:00:00");
  const base = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!time) return base;
  const [h, m] = time.split(":").map(Number);
  const tdisp = new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${base} · ${tdisp}`;
}

type Props = {
  eventId: string;
  /** Default date when opening fresh. Usually event.start_date. */
  defaultDateIso: string;
  /** Existing values for edit mode. */
  initial?: {
    customId?: string;
    label?: string | null;
    detail?: string | null;
    dateIso?: string;
    time?: string | null;
    traditionKey?: string | null;
  };
  onDone: () => void;
  /** Render note above the form. */
  note?: string;
};

/**
 * Free-text custom-milestone form. Used in two modes:
 *   - Add (initial undefined): inserts a new event_custom_milestones row.
 *   - Edit (initial.customId set): updates the existing row.
 *
 * Sacred-ceremony respect: label is optional. The placeholder normalizes the
 * private-ceremony case so the user doesn't feel pressure to disclose.
 * tradition_key is also optional — the chip selector includes a "(none)"
 * choice and starts on it.
 */
export function CustomMilestoneForm({ eventId, defaultDateIso, initial, onDone, note }: Props) {
  const isEdit = Boolean(initial?.customId);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [dateIso, setDateIso] = useState(initial?.dateIso ?? defaultDateIso);
  const [time, setTime] = useState<string | null>(initial?.time ?? null);
  const [traditionKey, setTraditionKey] = useState<string | null>(initial?.traditionKey ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      if (isEdit && initial?.customId) {
        const res = await updateCustomMilestone({
          id: initial.customId,
          label: label.trim() || null,
          detail: detail.trim() || null,
          customDateIso: dateIso,
          customTime: time,
          traditionKey: traditionKey,
        });
        if (!res.ok) {
          showToast(`Couldn’t save: ${res.error}`);
          return;
        }
        showToast(`<em>${label.trim() || "Reserved time"}</em> updated.`);
      } else {
        const res = await addCustomMilestone({
          eventId,
          label: label.trim() || null,
          detail: detail.trim() || null,
          customDateIso: dateIso,
          customTime: time,
          traditionKey: traditionKey,
        });
        if (!res.ok) {
          showToast(`Couldn’t save: ${res.error}`);
          return;
        }
        showToast(`<em>${label.trim() || "Reserved time"}</em> added to your timeline.`);
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={s.cmForm}>
      {note && <div className={s.cmNote}>{note}</div>}

      <label className={s.cmField}>
        <span className={s.cmFieldL}>Name (optional)</span>
        <input
          type="text"
          className={s.cmInput}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Private ceremony · Family blessing · Speech"
          maxLength={120}
        />
        <span className={s.cmHint}>
          You can leave this blank to block a time without naming the ceremony.
        </span>
      </label>

      <label className={s.cmField}>
        <span className={s.cmFieldL}>Notes (optional)</span>
        <textarea
          className={s.cmTextarea}
          rows={2}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Anything you want to remember about this"
          maxLength={500}
        />
      </label>

      <div className={s.cmField}>
        <span className={s.cmFieldL}>When</span>
        <button
          type="button"
          className={s.cmDateBtn}
          onClick={() => setPickerOpen(true)}
        >
          {formatDateChip(dateIso, time)}
        </button>
      </div>

      <div className={s.cmField}>
        <span className={s.cmFieldL}>Cultural tradition (optional)</span>
        <div className={s.cmChipRow}>
          <button
            type="button"
            className={`${s.cmChip} ${traditionKey === null ? s.cmChipOn : ""}`}
            onClick={() => setTraditionKey(null)}
          >
            (none)
          </button>
          {TRADITIONS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${s.cmChip} ${traditionKey === t.key ? s.cmChipOn : ""}`}
              onClick={() => setTraditionKey(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className={s.cmHint}>
          Tag only if it helps you. Sacred ceremonies can stay untagged.
        </span>
      </div>

      <div className={s.cmActions}>
        <button type="button" className={s.cmCancel} onClick={onDone}>Cancel</button>
        <button
          type="button"
          className={s.cmSave}
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Add to timeline"}
        </button>
      </div>

      <DateTimePickerModal
        open={pickerOpen}
        selectedDateIso={dateIso}
        selectedTime={time}
        allowPast
        onConfirm={(iso, t) => {
          setDateIso(iso);
          setTime(t);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
