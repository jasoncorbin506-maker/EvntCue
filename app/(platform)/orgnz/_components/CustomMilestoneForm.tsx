"use client";

import { useState } from "react";
import s from "../orgnz.module.css";
import { TRADITIONS } from "@/data/cultural-traditions";
import { ROS_PHASES, type RoSPhaseKey } from "@/data/ros-phases";
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
    rosPhase?: RoSPhaseKey | null;
    vendorName?: string | null;
    vendorContactEmail?: string | null;
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
 *
 * V-1c/Scope-A additions per inbox-cc/2026-05-24-custom-milestone-planning-
 * to-ros-hallway.md:
 *   - "Where in the day?" chip picker over the 12 universal RoS phases.
 *     NULL = planning-only (milestone lives on planning timeline only).
 *     Non-NULL surfaces the milestone in the day-of Run of Show at the
 *     matching phase slot (read path lands in Scope B after Cowork delivers
 *     structured recipes per outbox-cc/2026-05-24-recipe-library-structured-
 *     format-request.md).
 *   - Vendor section — vendor_name + vendor_contact_email inputs for the
 *     "Define your own" path. The Vndr-roster surfacing affordance (3–5
 *     candidate vendor cards) is deferred until V-2 Discover ships real
 *     published vendors; for V1 every milestone falls through to the
 *     define-your-own inputs.
 */
export function CustomMilestoneForm({ eventId, defaultDateIso, initial, onDone, note }: Props) {
  const isEdit = Boolean(initial?.customId);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [dateIso, setDateIso] = useState(initial?.dateIso ?? defaultDateIso);
  const [time, setTime] = useState<string | null>(initial?.time ?? null);
  const [traditionKey, setTraditionKey] = useState<string | null>(initial?.traditionKey ?? null);
  const [rosPhase, setRosPhase] = useState<RoSPhaseKey | null>(initial?.rosPhase ?? null);
  const [vendorName, setVendorName] = useState(initial?.vendorName ?? "");
  const [vendorContactEmail, setVendorContactEmail] = useState(
    initial?.vendorContactEmail ?? "",
  );
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
          rosPhase: rosPhase,
          vendorName: vendorName.trim() || null,
          vendorContactEmail: vendorContactEmail.trim() || null,
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
          rosPhase: rosPhase,
          vendorName: vendorName.trim() || null,
          vendorContactEmail: vendorContactEmail.trim() || null,
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

      {/* Where in the day? — Scope A from the EXISTENTIAL hallway brief.
       * NULL = planning-only milestone (default — e.g., "book the tea master").
       * Non-NULL surfaces the milestone in the day-of Run of Show at the
       * matching phase slot once the read-path lands (Scope B follow-up). */}
      <div className={s.cmField}>
        <span className={s.cmFieldL}>Where in the day? (optional)</span>
        <div className={s.cmChipRow}>
          <button
            type="button"
            className={`${s.cmChip} ${rosPhase === null ? s.cmChipOn : ""}`}
            onClick={() => setRosPhase(null)}
          >
            Planning only
          </button>
          {ROS_PHASES.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`${s.cmChip} ${rosPhase === p.key ? s.cmChipOn : ""}`}
              onClick={() => setRosPhase(p.key)}
              title={p.hintEn}
            >
              {p.labelEn}
            </button>
          ))}
        </div>
        <span className={s.cmHint}>
          Leave on Planning only if this milestone is a prep task (booking a
          vendor, ordering supplies). Pick a phase if the milestone happens
          during the event itself — it will surface in the Run of Show on the
          day of.
        </span>
      </div>

      {/* Vendor section — Scope A "Define your own" path. Vndr-roster
       * surfacing (3-5 candidate cards) is deferred until V-2 Discover ships
       * real published vendors; today every milestone falls through to these
       * inputs. */}
      <div className={s.cmField}>
        <span className={s.cmFieldL}>Vendor (optional)</span>
        <input
          type="text"
          className={s.cmInput}
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          placeholder="Vendor or person responsible"
          maxLength={200}
        />
        <input
          type="email"
          className={s.cmInput}
          value={vendorContactEmail}
          onChange={(e) => setVendorContactEmail(e.target.value)}
          placeholder="Contact email (optional)"
          autoComplete="off"
          maxLength={200}
          style={{ marginTop: 6 }}
        />
        <span className={s.cmHint}>
          Vendor matching from EvntCue&apos;s Vndr roster will surface here
          once Vndr Discover launches. For now, add who you have.
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
