"use client";

import { useMemo, useState } from "react";
import s from "../orgnz.module.css";
import {
  type Tradition,
  type Ceremony,
  orderTraditionsForSubtype,
} from "@/data/cultural-traditions";
import { addCustomMilestonesBatch } from "../_actions/add-custom-milestone";
import { updateSeedMilestone } from "../_actions/update-seed-milestone";
import { showToast } from "../_lib/toast";

type Props = {
  eventId: string;
  /** event.start_date ISO. */
  startDateIso: string;
  /** event.event_subtype — defaults the picker to this culture's chip. */
  subtypeKey: string | null;
  /** Stable keys already on the timeline (seed + custom). Used to dedupe. */
  existingKeys: Set<string>;
  /** Stable keys currently in events.milestone_overrides with status="dismissed". Adding one re-enables instead of duplicating. */
  dismissedSeedKeys: Set<string>;
  onDone: () => void;
};

function addDaysToIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type SelectionMap = Map<string, { tradition: Tradition; ceremony: Ceremony }>;

export function CulturalTraditionsPicker({
  eventId,
  startDateIso,
  subtypeKey,
  existingKeys,
  dismissedSeedKeys,
  onDone,
}: Props) {
  const ordered = useMemo(() => orderTraditionsForSubtype(subtypeKey), [subtypeKey]);
  const [activeKey, setActiveKey] = useState<string>(ordered[0]?.key ?? "catholic");
  const [selection, setSelection] = useState<SelectionMap>(new Map());
  const [submitting, setSubmitting] = useState(false);

  const active = ordered.find((t) => t.key === activeKey) ?? ordered[0];

  function toggle(tradition: Tradition, ceremony: Ceremony) {
    const next = new Map(selection);
    if (next.has(ceremony.key)) next.delete(ceremony.key);
    else next.set(ceremony.key, { tradition, ceremony });
    setSelection(next);
  }

  async function commit() {
    if (selection.size === 0) return;
    setSubmitting(true);
    try {
      // Split into two buckets:
      //   1. Dismissed-seed re-enables — clear status on existing override
      //   2. Net-new adds — INSERT into event_custom_milestones
      const seedToReenable: string[] = [];
      const adds: Array<{ tradition: Tradition; ceremony: Ceremony }> = [];

      for (const [key, entry] of selection) {
        if (dismissedSeedKeys.has(key)) {
          seedToReenable.push(key);
        } else if (existingKeys.has(key)) {
          // Already on the timeline (active seed or active custom) — silently skip.
          continue;
        } else {
          adds.push(entry);
        }
      }

      let reenableErr: string | null = null;
      for (const key of seedToReenable) {
        const res = await updateSeedMilestone({
          eventId,
          milestoneKey: key,
          patch: { status: null },
        });
        if (!res.ok) {
          reenableErr = res.error;
          break;
        }
      }

      if (reenableErr) {
        showToast(`Couldn’t re-enable: ${reenableErr}`);
        return;
      }

      if (adds.length > 0) {
        const items = adds.map(({ tradition, ceremony }) => ({
          label: ceremony.label,
          detail: ceremony.detail,
          customDateIso: addDaysToIso(startDateIso, ceremony.defaultOffsetDays),
          traditionKey: tradition.key,
          ceremonyKey: ceremony.key,
        }));
        const res = await addCustomMilestonesBatch({ eventId, items });
        if (!res.ok) {
          showToast(`Couldn’t add: ${res.error}`);
          return;
        }
      }

      const totalChanged = seedToReenable.length + adds.length;
      showToast(
        `<em>${totalChanged}</em> ${totalChanged === 1 ? "ceremony" : "ceremonies"} added to your timeline.`,
      );
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={s.pickerWrap}>
      <div className={s.pickerCultureRow}>
        {ordered.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${s.pickerCultureChip} ${activeKey === t.key ? s.pickerCultureChipOn : ""}`}
            onClick={() => setActiveKey(t.key)}
          >
            {t.label}
            {t.coverage === "partial" && (
              <span className={s.pickerCovBadge} aria-label="Still learning this tradition">·</span>
            )}
          </button>
        ))}
      </div>

      {active && (
        <div className={s.pickerCulturePane}>
          <div className={s.pickerCultureHead}>
            <div className={s.pickerCultureTitle}>{active.label} ceremonies</div>
            {active.partialNote && (
              <div className={s.pickerCovNote}>
                <em>Still learning.</em> {active.partialNote}
              </div>
            )}
          </div>

          <div className={s.pickerCeremonyList}>
            {active.ceremonies.map((c) => {
              const onTimeline = existingKeys.has(c.key) && !dismissedSeedKeys.has(c.key);
              const dismissed = dismissedSeedKeys.has(c.key);
              const selected = selection.has(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  className={`${s.pickerCeremony} ${selected ? s.pickerCeremonyOn : ""} ${onTimeline ? s.pickerCeremonyExist : ""}`}
                  onClick={() => !onTimeline && toggle(active, c)}
                  disabled={onTimeline}
                  aria-pressed={selected}
                >
                  <div className={s.pickerCeremonyL}>
                    <div className={s.pickerCeremonyT}>{c.label}</div>
                    <div className={s.pickerCeremonyD}>{c.detail}</div>
                  </div>
                  <div className={s.pickerCeremonyR}>
                    {onTimeline && <span className={s.pickerExistFlag}>On timeline</span>}
                    {dismissed && <span className={s.pickerReenableFlag}>Re-enable</span>}
                    {!onTimeline && !selected && <span className={s.pickerOffset}>{offsetLabel(c.defaultOffsetDays)}</span>}
                    {selected && <span className={s.pickerSelectedDot} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={s.pickerFooter}>
        <button type="button" className={s.pickerCancel} onClick={onDone}>Cancel</button>
        <button
          type="button"
          className={s.pickerCommit}
          onClick={commit}
          disabled={submitting || selection.size === 0}
        >
          {submitting
            ? "Adding…"
            : selection.size === 0
              ? "Pick at least one"
              : `Add ${selection.size} to timeline`}
        </button>
      </div>
    </div>
  );
}

function offsetLabel(days: number): string {
  if (days === 0) return "Day-of";
  if (days === -1) return "Day before";
  if (days === 1) return "Day after";
  if (days < 0) {
    const abs = Math.abs(days);
    if (abs < 30) return `${abs}d before`;
    const months = Math.round(abs / 30);
    return `${months}mo before`;
  }
  return `+${days}d`;
}
