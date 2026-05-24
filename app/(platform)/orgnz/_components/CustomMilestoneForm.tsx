"use client";

import { useState } from "react";
import s from "../orgnz.module.css";
import { TRADITIONS } from "@/data/cultural-traditions";
import { ROS_PHASES, type RoSPhaseKey } from "@/data/ros-phases";
import { addCustomMilestone } from "../_actions/add-custom-milestone";
import { updateCustomMilestone } from "../_actions/update-custom-milestone";
import { showToast } from "../_lib/toast";

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
 * Session 18w polish — five fixes bundled per Jason's feedback after the
 * hallway smoke:
 *
 *   1. Field order rearranged — identity (Name) → time (When) → day-of placement
 *      (Where in the day?) → vendor (Vendor) → context (Notes, Tradition).
 *      Previous order buried the phase picker AND the vendor section below
 *      Notes/Tradition; the most load-bearing fields are now first.
 *
 *   2. Native date + time inputs replace the cmDateBtn+modal pattern. Mobile
 *      gets the OS numpad time picker (great); desktop Safari gets the WebKit
 *      segment input (functional). Eliminates the modal-on-modal nesting that
 *      made the time selection feel buried.
 *
 *   3. Auto-default `rosPhase = "anchor_moment"` when user sets a custom_time
 *      and rosPhase is still null. The previous "Planning only" default meant
 *      time-set milestones silently never surfaced in RoS — the most reported
 *      smoke bug. User can refine to a different phase or click "Planning
 *      only" to opt back out.
 *
 *   4. Vendor section moved up + hint rewritten as present-tense action ("Add
 *      your vendor here. Matching candidates surface once Vndr Discover opens.")
 *
 *   5. Helper text brightness — .cmHint is now var(--txt2) (CSS-side fix).
 *
 * Sacred-ceremony respect preserved: label is still optional, tradition_key
 * is still optional, neither is required to save.
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
  const [submitting, setSubmitting] = useState(false);

  function handleTimeChange(next: string) {
    // Native <input type="time"> emits "" when cleared; treat empty as null
    // so the DB stores NULL and the RoS read-path treats it as time-TBD.
    const cleaned = next.trim();
    const nextTime = cleaned === "" ? null : cleaned;
    setTime(nextTime);
    // Auto-default the phase the first time a user assigns a time — anchor
    // moment is the natural "the thing the day exists to do." User can click
    // a different chip or "Planning only" to opt out.
    if (nextTime !== null && rosPhase === null) {
      setRosPhase("anchor_moment");
    }
  }

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

      {/* 1. Name (identity) */}
      <label className={s.cmField}>
        <span className={s.cmFieldL}>Name (optional)</span>
        <input
          type="text"
          className={s.cmInput}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Door games · Private ceremony · Family blessing"
          maxLength={120}
        />
        <span className={s.cmHint}>
          Leave blank to block a time without naming the ceremony.
        </span>
      </label>

      {/* 2. When (native date + time, inline — no modal) */}
      <div className={s.cmField}>
        <span className={s.cmFieldL}>When</span>
        <div className={s.cmDateTimeRow}>
          <input
            type="date"
            className={s.cmInput}
            value={dateIso}
            onChange={(e) => setDateIso(e.target.value)}
          />
          <input
            type="time"
            className={s.cmInput}
            value={time ?? ""}
            onChange={(e) => handleTimeChange(e.target.value)}
            step={300}
          />
        </div>
        <span className={s.cmHint}>
          Set a specific time if this happens on the day of the event. Leave
          the time blank for prep tasks.
        </span>
      </div>

      {/* 3. Where in the day? — auto-defaults to anchor_moment when a time
       * is set; otherwise stays "Planning only" (NULL). User can refine. */}
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
          {time
            ? "We defaulted to Anchor moment because you set a time. Pick a different phase to refine, or Planning only if this is a prep task."
            : "Pick a phase to surface this in the day-of Run of Show. Planning only keeps it on the planning timeline only."}
        </span>
      </div>

      {/* 4. Vendor — first-class section per session 18w polish. The Vndr-
       * roster surfacing affordance (3-5 candidate cards) lights up when
       * V-2 Discover ships published vendors. */}
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
          Add your vendor here. Matching candidates from EvntCue’s Vndr roster
          surface as cards once Vndr Discover opens.
        </span>
      </div>

      {/* 5. Notes (context) */}
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

      {/* 6. Cultural tradition (context — last because most users skip it) */}
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
    </div>
  );
}
