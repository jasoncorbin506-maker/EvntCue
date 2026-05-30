"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../orgnz.module.css";
import vendorRowStyles from "./VendorsAtEventSection.module.css";
import { showToast } from "../_lib/toast";
import {
  PHASE_ORDER,
  type MergedRoSRow,
} from "@/data/run-of-show/dispatch";
import { phaseLabel } from "@/data/run-of-show/phase-labels-by-event-type";
import type { RoSPhase } from "@/data/run-of-show/types";
import {
  presencesInPhase as filterPresencesInPhase,
  type VendorPresence,
} from "@/lib/events/vendor-presence-shared";
import type { VendorDetail } from "@/lib/orgnz/vendor-detail-shared";
import { AddVendorPopup } from "./AddVendorPopup";
import { AddVendorSheet } from "./AddVendorSheet";
import { VendorDetailSheet } from "./VendorDetailSheet";
import { VendorPresenceDots } from "./VendorPresenceDots";
import { VendorsAtEventSection } from "./VendorsAtEventSection";

function formatClock(d: Date): { time: string; period: string } {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return { time: `${h}:${mm}`, period };
}

type Props = {
  /** Event id — needed by add/delete vendor-presence server actions. */
  eventId: string;
  /** Display string for the section header — usually the event's start date. */
  headlineDate: string;
  /** Display label for the picked recipe (e.g., "Protestant Wedding"). */
  recipeLabel: string;
  /** event.event_type — drives phase-header label flavor via phaseLabel(). */
  eventType: string | null;
  /** Phase-bucketed merged rows from data/run-of-show/dispatch.mergeRecipeWithCustoms. */
  byPhase: Record<RoSPhase, MergedRoSRow[]>;
  /** Event-level vendor presence rows. Pre-sorted by sortPresences(). */
  vendorPresences: VendorPresence[];
  /** Per-vendor booking + notification + thread detail, keyed by vndr_tenant_id. */
  vendorDetailsByTenant: Record<string, VendorDetail>;
};

/**
 * Day-of mode Run-of-Show with Concept C session B vendor presence surfaces.
 *
 * Structure (top → bottom):
 *   1. Now-strip + clock
 *   2. RoS head ("Run of Show · {date}" + Edit button)
 *   3. VendorsAtEventSection (cast list above the first phase group)
 *   4. Phase groups, each:
 *      - Phase header (label + "+ Add vendor" affordance)
 *      - Milestones list (existing — dot-on-line + card)
 *      - VendorPresenceDots footer (renders only when ≥1 vendor in phase)
 *   5. "+ Add a moment" footer
 *
 * State (this component owns):
 *   - detailPresenceId: which VendorDetailSheet is open
 *   - addSheetOpen: generic AddVendorSheet open/closed
 *   - popupPhase: which phase has AddVendorPopup open (null = closed)
 *
 * Dot tap → smooth-scroll to the matching row in VendorsAtEventSection +
 * 400ms highlight pulse. Pure DOM approach (data-presence-id selector); no
 * scroll-anchor library needed.
 */
export function RunOfShow({
  eventId,
  headlineDate,
  recipeLabel,
  eventType,
  byPhase,
  vendorPresences,
  vendorDetailsByTenant,
}: Props) {
  const [clock, setClock] = useState<{ time: string; period: string }>(() =>
    formatClock(new Date()),
  );
  const [detailPresenceId, setDetailPresenceId] = useState<string | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [popupPhase, setPopupPhase] = useState<RoSPhase | null>(null);

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Only render phases that actually have content — keeps the surface tight
  // on recipes that skip phases (e.g., a corporate sales kickoff with no
  // ritual anchor_moment). A phase with vendor presence but no milestones
  // ALSO renders (so the user has somewhere to see / tap the vendor dots).
  const populatedPhases: { phase: RoSPhase; rows: MergedRoSRow[] }[] = useMemo(
    () =>
      PHASE_ORDER.flatMap((phase) => {
        const rows = byPhase[phase];
        const hasVendors = vendorPresences.some((p) =>
          p.phases.includes(phase),
        );
        return rows.length > 0 || hasVendors ? [{ phase, rows }] : [];
      }),
    [byPhase, vendorPresences],
  );

  const detailPresence = useMemo(
    () =>
      detailPresenceId
        ? vendorPresences.find((p) => p.id === detailPresenceId) ?? null
        : null,
    [detailPresenceId, vendorPresences],
  );

  // Smooth-scroll to the matching vendor row in VendorsAtEventSection + add
  // a brief pulse class so the user orients to the right row. Pure DOM
  // since the row knows its presence id via data attribute.
  const handleDotTap = useCallback((presenceId: string) => {
    const el = document.querySelector<HTMLElement>(
      `[data-presence-id="${presenceId}"]`,
    );
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add(vendorRowStyles.rowPulse);
    window.setTimeout(() => {
      el.classList.remove(vendorRowStyles.rowPulse);
    }, 450);
  }, []);

  const handleRowTap = useCallback((presenceId: string) => {
    setDetailPresenceId(presenceId);
  }, []);

  return (
    <section className={styles.ros}>
      <div className={styles.rosNowStrip}>
        <div className={styles.rosNowL}>
          <div className={styles.rosNowEye}>Day-of view</div>
          <div className={styles.rosNowT}>{recipeLabel}</div>
          <div className={styles.rosNowD}>Local time</div>
        </div>
        <div className={styles.rosNowTime} suppressHydrationWarning>
          {clock.time}
          <small>{clock.period}</small>
        </div>
      </div>

      <div className={styles.rosHead}>
        <span className={styles.rosHeadL}>Run of Show · {headlineDate}</span>
        <button
          type="button"
          className={styles.rosHeadR}
          onClick={() => showToast("Edit mode for Run of Show lands later.")}
        >
          Edit
        </button>
      </div>

      {/* Concept C session B — cast list above the first phase group. */}
      <VendorsAtEventSection
        presences={vendorPresences}
        onAddTap={() => setAddSheetOpen(true)}
        onRowTap={handleRowTap}
      />

      <div className={styles.rosTrack}>
        {populatedPhases.map(({ phase, rows }) => {
          const phaseVendors = filterPresencesInPhase(vendorPresences, phase);
          return (
            <div key={phase} className={styles.rosPhaseGroup}>
              <div className={styles.rosPhaseHead}>
                <span>{phaseLabel(eventType, phase)}</span>
                <button
                  type="button"
                  className={styles.rosPhaseHeadAdd}
                  onClick={() => setPopupPhase(phase)}
                  aria-label={`Add Vndr to ${phaseLabel(eventType, phase)}`}
                  title={`Add Vndr to ${phaseLabel(eventType, phase)}`}
                >
                  +
                </button>
              </div>
              {rows.map((row) => (
                <div key={row.key} className={styles.rosBlock}>
                  <div className={styles.rosTime}>{row.time}</div>
                  <div className={styles.rosBlockDot} />
                  <button
                    type="button"
                    className={styles.rosBlockCard}
                    onClick={() => showToast(`Editing <em>${row.title}</em>…`)}
                  >
                    <div className={styles.rosBlockBody}>
                      <div className={styles.rosBlockT}>{row.title}</div>
                      <div className={styles.rosBlockMeta}>
                        {row.vendor && (
                          <span className={styles.rosBlockMetaVendor}>
                            {row.vendor}
                          </span>
                        )}
                        {row.isCustom && (
                          <span className={styles.rosBlockCustomBadge}>
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
              <VendorPresenceDots
                presencesInPhase={phaseVendors}
                onDotTap={handleDotTap}
              />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.rosAdd}
        onClick={() =>
          showToast(
            "Add milestones from the planning timeline — they show up here when you tag them with a phase.",
          )
        }
      >
        <span className={styles.rosAddPlus}>+</span>
        <span>Add a moment to the Run of Show</span>
      </button>

      {/* Sheets + popup managed by RunOfShow state. */}
      <VendorDetailSheet
        presence={detailPresence}
        detail={
          detailPresence?.vendor_tenant_id
            ? vendorDetailsByTenant[detailPresence.vendor_tenant_id] ?? null
            : null
        }
        onClose={() => setDetailPresenceId(null)}
      />
      <AddVendorSheet
        open={addSheetOpen}
        eventId={eventId}
        onClose={() => setAddSheetOpen(false)}
      />
      <AddVendorPopup
        prefillPhase={popupPhase}
        eventId={eventId}
        onClose={() => setPopupPhase(null)}
      />
    </section>
  );
}
