"use client";

import { useState } from "react";
import s from "../orgnz.module.css";
import { ROS_PHASES, type RoSPhaseKey } from "@/data/ros-phases";
import { phaseLabel } from "@/data/run-of-show/phase-labels-by-event-type";
import { addCustomMilestone } from "../_actions/add-custom-milestone";
import { updateCustomMilestone } from "../_actions/update-custom-milestone";
import { showToast } from "../_lib/toast";

type Props = {
  eventId: string;
  /** Default date when opening fresh. Usually event.start_date. */
  defaultDateIso: string;
  /** event.event_type — drives wedding/corporate/nonprofit-flavored phase
   *  chip labels via phaseLabel(). Null falls back to universal labels. */
  eventType: string | null;
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
 * Session 18x polish — additional fixes after session 18w smoke:
 *   - Phase chip labels now use phaseLabel(eventType, phase) so wedding
 *     events see "Ceremony" / "Cocktail hour" / "Vows + first dance" etc.
 *     instead of the abstract "Opening" / "Transition" / "Anchor moment".
 *   - Cultural Tradition chip section removed. It served a Browse Traditions
 *     dedupe purpose that was noise for free-text adds. The traditionKey
 *     state stays so existing tagged milestones don't lose their tag on
 *     edit; only the UI is gone.
 *
 * Sacred-ceremony respect preserved: label is still optional, neither
 * label nor traditionKey is required to save.
 */
export function CustomMilestoneForm({
  eventId,
  defaultDateIso,
  eventType,
  initial,
  onDone,
  note,
}: Props) {
  const isEdit = Boolean(initial?.customId);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [dateIso, setDateIso] = useState(initial?.dateIso ?? defaultDateIso);
  const [time, setTime] = useState<string | null>(initial?.time ?? null);
  // traditionKey carries through on edit but is no longer user-editable from
  // this form (session 18x fix 6 — UI removed). Browse Traditions remains
  // the canonical surface for cultural tagging.
  const [traditionKey] = useState<string | null>(initial?.traditionKey ?? null);
  const [rosPhase, setRosPhase] = useState<RoSPhaseKey | null>(initial?.rosPhase ?? null);
  const [vendorName, setVendorName] = useState(initial?.vendorName ?? "");
  const [vendorContactEmail, setVendorContactEmail] = useState(
    initial?.vendorContactEmail ?? "",
  );
  const [submitting, setSubmitting] = useState(false);

  function handleTimeChange(next: string) {
    const cleaned = next.trim();
    const nextTime = cleaned === "" ? null : cleaned;
    setTime(nextTime);
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

  // Resolved label for the "anchor_moment" default — surfaces in the helper
  // copy so it matches the chip's displayed label (e.g., "Vows + first dance"
  // for weddings instead of the abstract "Anchor moment").
  const anchorLabel = phaseLabel(eventType, "anchor_moment");

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
          placeholder="e.g., Door games · Private ceremony · Family blessing"
          maxLength={120}
        />
        <span className={s.cmHint}>
          Leave blank to block a time without naming the ceremony.
        </span>
      </label>

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
              {phaseLabel(eventType, p.key)}
            </button>
          ))}
        </div>
        <span className={s.cmHint}>
          {time
            ? `We defaulted to ${anchorLabel} because you set a time. Pick a different phase to refine, or Planning only if this is a prep task.`
            : "Pick a phase to surface this in the day-of Run of Show. Planning only keeps it on the planning timeline only."}
        </span>
      </div>

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
