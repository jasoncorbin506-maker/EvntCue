"use client";

import { useEffect, useState } from "react";
import styles from "../orgnz.module.css";
import {
  CRISIS_QUICK_ACTIONS,
  CRISIS_VENDORS,
  DEFAULT_SHIFT,
  MOMENT_ACTIONS,
  SHIFT_BLOCKS,
  SHIFT_OPTIONS,
} from "../_lib/crisis-data";
import { onCrisisChange, openCrisis } from "../_lib/sheet";
import { showToast } from "../_lib/toast";

type Triage = "vendors" | "moment" | "shift";

function formatClock(d: Date): { time: string; period: string } {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return { time: `${h}:${mm}`, period };
}

export function CrisisModal() {
  const [open, setOpen] = useState(false);
  useEffect(() => onCrisisChange(setOpen), []);
  if (!open) return null;
  return <CrisisCard />;
}

function CrisisCard() {
  const [tab, setTab] = useState<Triage>("vendors");
  const [shift, setShift] = useState<number>(DEFAULT_SHIFT);
  const [clock, setClock] = useState<{ time: string; period: string }>(() =>
    formatClock(new Date()),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") openCrisis(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    const id = window.setInterval(
      () => setClock(formatClock(new Date())),
      10_000,
    );
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className={styles.crisis} role="dialog" aria-modal="true" aria-label="12-Minute Bump">
      <div className={styles.crisisHead}>
        <div className={styles.crisisHeadL}>
          <span className={styles.crisisPulse} />
          <span className={styles.crisisModeL}>12-Minute Bump</span>
        </div>
        <button
          type="button"
          className={styles.crisisX}
          onClick={() => openCrisis(false)}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <h1 className={styles.crisisTitle}>
        You&rsquo;ve got this.
        <br />
        <em>Twelve minutes is enough.</em>
      </h1>
      <p className={styles.crisisCue}>
        <em>Cue is here.</em> Pick what&rsquo;s happening — Vndr trouble, you need a minute, or
        you need to slide the timeline. One tap and we move.
      </p>

      <div className={styles.triageTabs}>
        <button
          type="button"
          className={`${styles.ttBtn} ${tab === "vendors" ? styles.ttActive : ""}`}
          onClick={() => setTab("vendors")}
        >
          Vendor / guest
        </button>
        <button
          type="button"
          className={`${styles.ttBtn} ${tab === "moment" ? styles.ttActive : ""}`}
          onClick={() => setTab("moment")}
        >
          I need a minute
        </button>
        <button
          type="button"
          className={`${styles.ttBtn} ${tab === "shift" ? styles.ttActive : ""}`}
          onClick={() => setTab("shift")}
        >
          Push timeline
        </button>
      </div>

      {tab === "vendors" && (
        <div className={styles.crisisPane}>
          <div className={styles.crisisTimer}>
            <div>
              <div className={styles.crisisTimerL}>Right now</div>
              <div className={styles.crisisTimerV}>
                {clock.time}
                <em>{clock.period}</em>
              </div>
            </div>
            <div className={styles.crisisTimerD}>
              Ceremony begins in <strong>18 min</strong>
              <br />
              Bridal party in position
            </div>
          </div>

          <div className={styles.crisisSection}>
            <div className={styles.crisisSl}>Vndrs on site</div>
            {CRISIS_VENDORS.map((v) => (
              <div key={v.name} className={styles.crisisVendor}>
                <span
                  className={`${styles.cvStatus} ${
                    v.status === "ok"
                      ? styles.cvOk
                      : v.status === "late"
                      ? styles.cvLate
                      : styles.cvUnknown
                  }`}
                />
                <div className={styles.cvBody}>
                  <div className={styles.cvName}>{v.name}</div>
                  <div className={styles.cvRole}>{v.role}</div>
                </div>
                <button
                  type="button"
                  className={styles.cvCall}
                  onClick={() => showToast(`Calling <em>${v.name}</em>…`)}
                  aria-label="Call"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A18 18 0 013 6a2 2 0 012-2z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className={styles.crisisSection}>
            <div className={styles.crisisSl}>One-tap actions</div>
            <div className={styles.crisisQuick}>
              {CRISIS_QUICK_ACTIONS.map((q) => (
                <button
                  key={q.title}
                  type="button"
                  className={styles.cqBtn}
                  onClick={() => showToast(q.toast)}
                >
                  <span className={styles.cqBtnIco}>
                    <svg viewBox="0 0 24 24">
                      <path d={q.iconPath} />
                    </svg>
                  </span>
                  <span className={styles.cqBtnT}>{q.title}</span>
                  <span className={styles.cqBtnD}>{q.detail}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "moment" && (
        <div className={styles.crisisPane}>
          <div className={styles.momentCard}>
            <div className={styles.momentCardEye}>A note from Cue</div>
            <p className={styles.momentCardPh}>
              It&rsquo;s a <em>big day</em>. Wanting a minute is the most normal thing in the
              world.
            </p>
            <p className={styles.momentCardPb}>
              Nothing on this screen calls anyone or moves the timeline. Just for you.
            </p>
          </div>

          <div className={styles.crisisSection}>
            <div className={styles.crisisSl}>If you want to talk to someone</div>
            <div className={styles.momentActions}>
              {MOMENT_ACTIONS.map((a) => (
                <button
                  key={a.title}
                  type="button"
                  className={styles.momentAction}
                  onClick={() => showToast(a.toast)}
                >
                  <span className={styles.momentActionIco}>
                    <svg viewBox="0 0 24 24">
                      <path d={a.iconPath} />
                    </svg>
                  </span>
                  <span className={styles.momentActionT}>{a.title}</span>
                  <span className={styles.momentActionD}>{a.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.momentBreathe}>
            <div className={styles.breatheOrb} />
            <p className={styles.breatheL}>
              <em>Breathe in. Breathe out.</em>
              <br />
              The orb sets the pace. 5.5 seconds in, 5.5 out.
            </p>
          </div>
        </div>
      )}

      {tab === "shift" && (
        <div className={styles.crisisPane}>
          <div className={styles.shiftCard}>
            <div className={styles.shiftCardL}>Slide the day · cascade to Vndrs</div>
            <div className={styles.shiftCardT}>Push the next milestone by:</div>
            <div className={styles.shiftOptions}>
              {SHIFT_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`${styles.shiftPill} ${
                    shift === mins ? styles.shiftPillOn : ""
                  }`}
                  onClick={() => setShift(mins)}
                >
                  {mins}
                  <small>min</small>
                </button>
              ))}
            </div>
            <div className={styles.shiftFoot}>
              Every later block shifts by the same amount. Vendors are pinged
              automatically.
            </div>
          </div>

          <div className={styles.crisisSection}>
            <div className={styles.crisisSl}>Or update one block</div>
            {SHIFT_BLOCKS.map((b) => (
              <div key={b.title} className={styles.drItem}>
                <div className={styles.drItemIco}>
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <div className={styles.drItemBody}>
                  <div className={styles.drItemT}>{b.title}</div>
                  <div className={styles.drItemD}>{b.detail}</div>
                </div>
                <button
                  type="button"
                  className={styles.drItemAction}
                  onClick={() => showToast(`Editing <em>${b.title}</em>…`)}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.crisisFoot}>
        Calm. <em>Then act.</em>
      </div>
    </div>
  );
}
