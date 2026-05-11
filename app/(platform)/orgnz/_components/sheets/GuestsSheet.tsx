"use client";

import styles from "../../orgnz.module.css";
import { Sheet } from "../Sheet";
import { showToast } from "../../_lib/toast";
import { openTravel } from "../../_lib/sheet";
import {
  RECENT_RSVPS,
  RSVP_HERO,
  TRAVEL_ROWS,
  TRAVEL_STATS,
} from "../../_lib/guests-data";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function GuestsSheet({ open, onClose }: Props) {
  const pct = Math.round((RSVP_HERO.inCount / RSVP_HERO.total) * 100);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="Guests"
      eyebrowAccent="blue"
      title={
        <>
          {RSVP_HERO.inCount} <em>RSVP&rsquo;d</em> of {RSVP_HERO.total}
        </>
      }
    >
      <div className={`${styles.sheetHero} ${styles.sheetHeroBlue}`}>
        <div className={`${styles.sheetHeroL} ${styles.sheetHeroLBlue}`}>RSVP rate</div>
        <div className={styles.sheetHeroV}>
          <em>{pct}</em>%
        </div>
        <div className={styles.sheetHeroOf}>
          <em>{RSVP_HERO.inCount} in</em> · <em>{RSVP_HERO.pendingCount} pending</em> ·{" "}
          {RSVP_HERO.weeksLeft} weeks left
        </div>
        <div className={styles.sheetHeroBar}>
          <div
            className={`${styles.sheetHeroBarFill} ${styles.sheetHeroBarFillBlue}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className={styles.actionGrid}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnBlue}`}
          onClick={() =>
            showToast(
              `Send-nudge wires in <em>Phase 4</em>. ${RSVP_HERO.pendingCount} pending RSVPs.`,
            )
          }
        >
          <span className={styles.actionBtnIco}>
            <svg viewBox="0 0 24 24">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </span>
          <span className={styles.actionBtnT}>Send nudge</span>
          <span className={styles.actionBtnD}>
            {RSVP_HERO.pendingCount} guests · email + text
          </span>
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnBlue}`}
          onClick={() =>
            showToast("Guest-list manager lands with the paid tier in <em>Phase 4</em>.")
          }
        >
          <span className={styles.actionBtnIco}>
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
          </span>
          <span className={styles.actionBtnT}>Manage list</span>
          <span className={styles.actionBtnD}>Add · seat · dietary</span>
        </button>
      </div>

      <div className={styles.sectionL}>Recent RSVPs</div>
      {RECENT_RSVPS.map((r) => (
        <div key={r.name} className={styles.li}>
          <div className={styles.liBody}>
            <div className={styles.liT}>{r.name}</div>
            <div className={styles.liMeta}>
              <em className={r.answer === "yes" ? styles.metaYes : styles.metaNo}>
                {r.answer === "yes" ? "Yes" : "No"}
              </em>{" "}
              · {r.meta}
            </div>
          </div>
          <div className={styles.liAmtNote}>{r.when}</div>
        </div>
      ))}

      <div className={styles.sectionL}>
        Travel <span className={styles.pluginTag}>Plug-in · coming soon</span>
      </div>
      <div className={styles.travelGrid}>
        {TRAVEL_STATS.map((s) => (
          <div key={s.label} className={styles.tgCard}>
            <div className={styles.tgL}>{s.label}</div>
            <div className={styles.tgV}>{s.value}</div>
            <div className={styles.tgD}>{s.detail}</div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.browseCta} ${styles.browseCtaBlue}`}
        onClick={() => openTravel(true)}
      >
        <div className={styles.browseCtaL}>
          <div className={styles.browseCtaEye}>Send the save-the-date</div>
          <div className={styles.browseCtaT}>
            RSVP · travel · gifts · <em>one smart link</em>
          </div>
        </div>
        <span className={styles.browseCtaArrow}>→</span>
      </button>

      <div className={styles.actionList}>
        {TRAVEL_ROWS.map((row, idx) => (
          <button
            key={row.title}
            type="button"
            className={styles.actionRow}
            onClick={() =>
              idx === TRAVEL_ROWS.length - 1
                ? showToast(`<em>${row.title}</em> · ${row.detail}`)
                : openTravel(true)
            }
          >
            <div className={styles.actionRowIco}>
              <svg viewBox="0 0 24 24">
                <path d={row.iconPath} />
              </svg>
            </div>
            <div className={styles.actionRowBody}>
              <div className={styles.actionRowT}>{row.title}</div>
              <div className={styles.actionRowD}>{row.detail}</div>
            </div>
            <span className={styles.actionRowArrow}>→</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
