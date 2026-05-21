"use client";

import { useEffect, useState } from "react";
import styles from "../orgnz.module.css";
import { showToast } from "../_lib/toast";
import { ROS_BLOCKS, ROS_HEAD_LABEL, ROS_NOW } from "../_lib/ros-data";

function formatClock(d: Date): { time: string; period: string } {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return { time: `${h}:${mm}`, period };
}

/**
 * Day-of mode Run-of-Show. CSS-gated to render only when `.app.dayof` is on
 * (mockup convention — same way Feed/TileGrid/Rail are gated to planning).
 * Clock ticks every 30s; cheap enough to leave running across modes.
 */
export function RunOfShow() {
  const [clock, setClock] = useState<{ time: string; period: string }>(() =>
    formatClock(new Date()),
  );

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className={styles.ros}>
      <div className={styles.rosNowStrip}>
        <div className={styles.rosNowL}>
          <div className={styles.rosNowEye}>{ROS_NOW.eyebrow}</div>
          <div className={styles.rosNowT}>{ROS_NOW.title}</div>
          <div className={styles.rosNowD}>{ROS_NOW.detail}</div>
        </div>
        <div className={styles.rosNowTime} suppressHydrationWarning>
          {clock.time}
          <small>{clock.period}</small>
        </div>
      </div>

      <div className={styles.rosHead}>
        <span className={styles.rosHeadL}>{ROS_HEAD_LABEL}</span>
        <button
          type="button"
          className={styles.rosHeadR}
          onClick={() => showToast("Edit mode for Run of Show lands later.")}
        >
          Edit
        </button>
      </div>

      <div className={styles.rosTrack}>
        {ROS_BLOCKS.map((b, i) => {
          const stateClass =
            b.state === "live"
              ? styles.rosBlockLive
              : b.state === "done"
              ? styles.rosBlockDone
              : b.state === "next"
              ? styles.rosBlockNext
              : "";
          const statusLabel =
            b.state === "live"
              ? "Live"
              : b.state === "done"
              ? "Done"
              : b.state === "next"
              ? "Next"
              : null;
          return (
            <div key={i} className={`${styles.rosBlock} ${stateClass}`}>
              <div className={styles.rosTime}>{b.time}</div>
              <div className={styles.rosBlockDot} />
              <button
                type="button"
                className={styles.rosBlockCard}
                onClick={() => showToast(`Editing <em>${b.title}</em>…`)}
              >
                <div className={styles.rosBlockBody}>
                  <div className={styles.rosBlockT}>{b.title}</div>
                  <div className={styles.rosBlockMeta}>
                    <span className={styles.rosBlockMetaVendor}>{b.vendor}</span>
                  </div>
                </div>
                {statusLabel && (
                  <span
                    className={`${styles.rosBlockStatus} ${
                      b.state === "live"
                        ? styles.rosStatusLive
                        : b.state === "done"
                        ? styles.rosStatusDone
                        : styles.rosStatusNext
                    }`}
                  >
                    {statusLabel}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.rosAdd}
        onClick={() =>
          showToast("Insert speech, toast, dance, or custom moment.")
        }
      >
        <span className={styles.rosAddPlus}>+</span>
        <span>Insert moment · speech · dance · toast</span>
      </button>
    </section>
  );
}
