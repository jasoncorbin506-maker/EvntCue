"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../orgnz.module.css";
import type { RailPin, RailPinState } from "../_lib/timeline";
import { RailDrawer } from "./RailDrawer";
import { AddMilestoneSheet } from "./AddMilestoneSheet";

type Props = {
  pins: RailPin[];
  eventId: string;
  startDateIso: string;
  subtypeKey: string | null;
  /** Stable keys of seed milestones that are currently dismissed. Lets the picker offer "re-enable" instead of "already there." */
  dismissedSeedKeys: string[];
};

const STATE_CLASS: Record<RailPinState, string> = {
  today: styles.today,
  gate: styles.gate,
  dayof: styles.pinDayof,
  travel: styles.travel,
  past: styles.past,
  default: "",
};

export function TimelineRail({ pins, eventId, startDateIso, subtypeKey, dismissedSeedKeys }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [openPin, setOpenPin] = useState<RailPin | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const existingKeys = useMemo(() => {
    const set = new Set<string>();
    for (const pin of pins) {
      if (pin.milestoneKey) set.add(pin.milestoneKey);
      if (pin.origin === "custom") {
        // Pick up ceremony provenance — when a tradition was added from the
        // picker, its tradition_key alone isn't enough to dedupe; we'd need
        // ceremony_key on the row. Skip for v1 — the picker re-add path
        // becomes "Already on your timeline" only when the seed has the key.
      }
    }
    return set;
  }, [pins]);

  const dismissedSet = useMemo(() => new Set(dismissedSeedKeys), [dismissedSeedKeys]);

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
            className={styles.railHeadAdd}
            onClick={() => setAddOpen(true)}
          >
            + Add
          </button>
        </div>
        <div className={styles.railScroll} ref={scrollRef}>
          <div className={styles.railLine}>
            {pins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                className={[
                  styles.railPin,
                  STATE_CLASS[pin.state],
                  pin.isDone ? styles.railPinDone : "",
                  pin.origin === "custom" ? styles.railPinCustom : "",
                ].filter(Boolean).join(" ")}
                onClick={() => setOpenPin(pin)}
              >
                {pin.state === "today" && (
                  <span className={styles.railTodayFlag}>Today</span>
                )}
                {pin.origin === "custom" && (
                  <span className={styles.railCustomFlag} aria-label="Your custom milestone">+</span>
                )}
                <div className={styles.railPinDot} />
                <div className={styles.railPinWhen}>
                  {pin.when}
                  {pin.whenTime && (
                    <span className={styles.railPinTime}> · {pin.whenTime}</span>
                  )}
                </div>
                <div className={styles.railPinLabel}>{pin.label}</div>
              </button>
            ))}
            <button
              type="button"
              className={styles.railAddInline}
              onClick={() => setAddOpen(true)}
              aria-label="Add a milestone"
            >
              <div className={styles.railAddDot}>+</div>
              <div className={styles.railAddLabel}>Add</div>
            </button>
          </div>
        </div>
      </section>
      <RailDrawer
        pin={openPin}
        eventId={eventId}
        startDateIso={startDateIso}
        onClose={() => setOpenPin(null)}
      />
      <AddMilestoneSheet
        open={addOpen}
        eventId={eventId}
        startDateIso={startDateIso}
        subtypeKey={subtypeKey}
        existingKeys={existingKeys}
        dismissedSeedKeys={dismissedSet}
        onClose={() => setAddOpen(false)}
      />
    </>
  );
}
