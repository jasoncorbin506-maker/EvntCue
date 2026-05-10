"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../orgnz.module.css";
import { showToast } from "../_lib/toast";
import type { RailPin, RailPinState } from "../_lib/timeline";
import { RailDrawer } from "./RailDrawer";

type Props = { pins: RailPin[] };

const STATE_CLASS: Record<RailPinState, string> = {
  today: styles.today,
  gate: styles.gate,
  dayof: styles.pinDayof,
  travel: styles.travel,
  past: styles.past,
  default: "",
};

export function TimelineRail({ pins }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [openPin, setOpenPin] = useState<RailPin | null>(null);

  useEffect(() => {
    // Center the today pin on first paint
    const scroller = scrollRef.current;
    if (!scroller) return;
    const todayEl = scroller.querySelector<HTMLButtonElement>(`.${styles.today}`);
    if (!todayEl) return;
    const left = todayEl.offsetLeft - scroller.clientWidth / 2 + todayEl.clientWidth / 2;
    scroller.scrollTo({ left: Math.max(0, left), behavior: "instant" });
  }, [pins]);

  return (
    <>
      <section className={styles.railWrap}>
        <div className={styles.railHead}>
          <span className={styles.railHeadL}>Timeline</span>
          <button
            type="button"
            className={styles.railHeadR}
            onClick={() => showToast("Full timeline view opens in <em>3.2.B</em>.")}
          >
            Full view
          </button>
        </div>
        <div className={styles.railScroll} ref={scrollRef}>
          <div className={styles.railLine}>
            {pins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                className={`${styles.railPin} ${STATE_CLASS[pin.state]}`}
                onClick={() => setOpenPin(pin)}
              >
                {pin.state === "today" && (
                  <span className={styles.railTodayFlag}>Today</span>
                )}
                <div className={styles.railPinDot} />
                <div className={styles.railPinWhen}>{pin.when}</div>
                <div className={styles.railPinLabel}>{pin.label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>
      <RailDrawer pin={openPin} onClose={() => setOpenPin(null)} />
    </>
  );
}
