"use client";

import { useMemo, useState } from "react";
import s from "../orgnz.module.css";
import {
  getMilestones,
  formatLead,
  type MilestoneWithStatus,
} from "@/data/event-milestones";
import type { CategoryKey } from "@/data/budget-presets";
import { addCustomMilestonesBatch } from "../_actions/add-custom-milestone";
import { showToast } from "../_lib/toast";

/**
 * Event-type milestone picker for the add-to-timeline sheet (Lock 30 follow-up).
 *
 * The wedding flow browses cultural ceremonies (CulturalTraditionsPicker). Every
 * OTHER category browses its event-type milestone catalog instead — a corporate
 * gala sees gala milestones (venue lock, nominees, sponsors…), not wedding
 * ceremonies. Both feed the same `event_custom_milestones` batch insert.
 */

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.44;

function leadToDateIso(startDateIso: string, leadMonths: number): string {
  const start = new Date(startDateIso + "T00:00:00");
  const d = new Date(start.getTime() - Math.round(leadMonths * DAYS_PER_MONTH) * MS_PER_DAY);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  eventId: string;
  startDateIso: string;
  category: CategoryKey;
  subtypeKey: string | null;
  existingKeys: Set<string>;
  onDone: () => void;
};

export function CatalogMilestonePicker({
  eventId,
  startDateIso,
  category,
  subtypeKey,
  existingKeys,
  onDone,
}: Props) {
  const [nowMs] = useState(() => Date.now());
  const milestones = useMemo<MilestoneWithStatus[]>(() => {
    const start = new Date(startDateIso + "T00:00:00").getTime();
    const monthsUntil = Math.max(0, (start - nowMs) / (MS_PER_DAY * DAYS_PER_MONTH));
    return getMilestones(category, subtypeKey, monthsUntil);
  }, [category, subtypeKey, startDateIso, nowMs]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function commit() {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const items = milestones
        .filter((m) => selected.has(m.key) && !existingKeys.has(m.key))
        .map((m) => ({
          label: m.label,
          detail: m.detail ?? null,
          customDateIso: leadToDateIso(startDateIso, m.lead),
          // Stable key so re-browsing dedupes against the timeline.
          traditionKey: m.key,
          ceremonyKey: m.key,
        }));
      if (items.length > 0) {
        const res = await addCustomMilestonesBatch({ eventId, items });
        if (!res.ok) {
          showToast(`Couldn’t add: ${res.error}`);
          return;
        }
      }
      showToast(
        `<em>${items.length}</em> milestone${items.length === 1 ? "" : "s"} added to your timeline.`,
      );
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={s.pickerWrap}>
      <div className={s.pickerCeremonyList}>
        {milestones.map((m) => {
          const onTimeline = existingKeys.has(m.key);
          const isSelected = selected.has(m.key);
          return (
            <button
              key={m.key}
              type="button"
              className={`${s.pickerCeremony} ${isSelected ? s.pickerCeremonyOn : ""} ${onTimeline ? s.pickerCeremonyExist : ""}`}
              onClick={() => !onTimeline && toggle(m.key)}
              disabled={onTimeline}
              aria-pressed={isSelected}
            >
              <div className={s.pickerCeremonyL}>
                <div className={s.pickerCeremonyT}>{m.label}</div>
                {m.detail && <div className={s.pickerCeremonyD}>{m.detail}</div>}
              </div>
              <div className={s.pickerCeremonyR}>
                {onTimeline ? (
                  <span className={s.pickerExistFlag}>On timeline</span>
                ) : isSelected ? (
                  <span className={s.pickerSelectedDot} />
                ) : (
                  <span className={s.pickerOffset}>{formatLead(m.lead)}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className={s.pickerFooter}>
        <button type="button" className={s.pickerCancel} onClick={onDone}>
          Cancel
        </button>
        <button
          type="button"
          className={s.pickerCommit}
          onClick={commit}
          disabled={submitting || selected.size === 0}
        >
          {submitting
            ? "Adding…"
            : selected.size === 0
              ? "Pick at least one"
              : `Add ${selected.size} to timeline`}
        </button>
      </div>
    </div>
  );
}
