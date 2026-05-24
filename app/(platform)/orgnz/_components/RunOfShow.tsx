"use client";

import { useEffect, useState } from "react";
import styles from "../orgnz.module.css";
import { showToast } from "../_lib/toast";
import {
  PHASE_LABELS,
  PHASE_ORDER,
  type MergedRoSRow,
} from "@/data/run-of-show/dispatch";
import type { RoSPhase } from "@/data/run-of-show/types";

function formatClock(d: Date): { time: string; period: string } {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return { time: `${h}:${mm}`, period };
}

type Props = {
  /** Display string for the section header — usually the event's start date. */
  headlineDate: string;
  /** Display label for the picked recipe (e.g., "Protestant Wedding"). */
  recipeLabel: string;
  /** Phase-bucketed merged rows from data/run-of-show/dispatch.mergeRecipeWithCustoms. */
  byPhase: Record<RoSPhase, MergedRoSRow[]>;
};

/**
 * Day-of mode Run-of-Show. CSS-gated to render only when `.app.dayof` is on
 * (mockup convention — same way Feed/TileGrid/Rail are gated to planning).
 *
 * V-Scope-B rewrite (2026-05-24, EXISTENTIAL hallway brief): RoS now reads
 * the merged recipe + custom-milestone sequence rather than the prior
 * stubbed `ROS_BLOCKS` array. Recipe picked by event_type + event_subtype
 * via data/run-of-show/dispatch.pickRecipe; custom milestones with
 * ros_phase IS NOT NULL merged in per phase. Empty phases collapse.
 *
 * Live "now" strip is still here (clock ticks every 30s) but states on
 * individual rows are deliberately NOT computed — recipes mix anchor-
 * relative ("ceremony − 90 min") and wall-clock ("4:30 PM") time strings,
 * so a single done/live/next state derivation across both formats would
 * be unreliable in V1. State coloring is a polish-pass item once item
 * times normalize to wall-clock (likely after a recipe-author pass that
 * resolves anchor-relative to clock per event).
 */
export function RunOfShow({ headlineDate, recipeLabel, byPhase }: Props) {
  const [clock, setClock] = useState<{ time: string; period: string }>(() =>
    formatClock(new Date()),
  );

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Only render phases that actually have content — keeps the surface tight
  // on recipes that skip phases (e.g., a corporate sales kickoff with no
  // ritual anchor_moment).
  const populatedPhases: { phase: RoSPhase; rows: MergedRoSRow[] }[] =
    PHASE_ORDER.flatMap((phase) => {
      const rows = byPhase[phase];
      return rows.length > 0 ? [{ phase, rows }] : [];
    });

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

      <div className={styles.rosTrack}>
        {populatedPhases.map(({ phase, rows }) => (
          <div key={phase} className={styles.rosPhaseGroup}>
            <div className={styles.rosPhaseHead}>{PHASE_LABELS[phase]}</div>
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
          </div>
        ))}
      </div>

      <button
        type="button"
        className={styles.rosAdd}
        onClick={() =>
          showToast("Add milestones from the planning timeline — they show up here when you tag them with a phase.")
        }
      >
        <span className={styles.rosAddPlus}>+</span>
        <span>Add a moment to the Run of Show</span>
      </button>
    </section>
  );
}
