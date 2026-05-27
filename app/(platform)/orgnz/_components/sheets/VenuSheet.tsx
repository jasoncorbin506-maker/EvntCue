"use client";

import styles from "../../orgnz.module.css";
import { Sheet } from "../Sheet";
import { showToast } from "../../_lib/toast";

type Props = {
  open: boolean;
  onClose: () => void;
  hasVenu: boolean;
};

export function VenuSheet({ open, onClose, hasVenu }: Props) {
  if (!hasVenu) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        eyebrow="Venu"
        eyebrowAccent="blue"
        title={
          <>
            Lock the <em>date</em>
          </>
        }
      >
        <div className={styles.sheetEmpty}>
          <div className={styles.sheetEmptyT}>
            <em>No venue locked yet.</em>
          </div>
          <div className={styles.sheetEmptyB}>
            Per <em>Lock 5a</em>, the date isn&rsquo;t real until the venue confirms. Everything else — vendors, RSVPs, run of show — hangs off this.
          </div>
        </div>

        <button
          type="button"
          className={`${styles.browseCta} ${styles.browseCtaBlue}`}
          onClick={() => showToast("DFW Venu Marketplace opens when the portal ships.")}
        >
          <div className={styles.browseCtaL}>
            <div className={styles.browseCtaEye}>Find your venue</div>
            <div className={styles.browseCtaT}>Browse DFW venues →</div>
          </div>
          <span className={styles.browseCtaArrow}>→</span>
        </button>
      </Sheet>
    );
  }

  // Reserved for when venue locks land (Phase 5+). For now we never hit this branch
  // because hasVenu is hardcoded false in page.tsx until bookings flow.
  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="Venu"
      eyebrowAccent="blue"
      title={<em>Brighton Abbey</em>}
    >
      <div className={styles.venuCard}>
        <div className={styles.venuName}>
          <em>Brighton</em> Abbey
        </div>
        <div className={styles.venuAddr}>12420 Country Club Dr · Argyle, TX 76226</div>
        <div className={styles.venuStats}>
          <div>
            <div className={styles.venuStatL}>Capacity</div>
            <div className={styles.venuStatV}>220</div>
          </div>
          <div>
            <div className={styles.venuStatL}>Walkthroughs</div>
            <div className={styles.venuStatV}>2 done</div>
          </div>
          <div>
            <div className={styles.venuStatL}>Day-of</div>
            <div className={styles.venuStatV}>Tom · house mgr</div>
          </div>
        </div>
      </div>
      <div className={styles.sectionL}>Quick access</div>
      <div className={styles.actionList}>
        {[
          { t: "Get directions", d: "28 min from Sofia · 41 min Marcus" },
          { t: "Call Tom · house manager", d: "(940) 555-0188 · day-of contact" },
          { t: "Signed contract", d: "Executed Mar 28 · $11,200" },
          { t: "Walkthrough notes", d: "2 sessions · 14 photos · 8 to-dos" },
          { t: "Floor plan + capacity", d: "Ceremony 175 · reception 220" },
          { t: "Approved Vndr list", d: "Brighton&rsquo;s preferred · 18 names" },
        ].map((row) => (
          <button
            key={row.t}
            type="button"
            className={styles.actionRow}
            onClick={() => showToast(`<em>${row.t}</em> — full venue surface ships with Phase 5.`)}
          >
            <div className={styles.actionRowIco}>
              <svg viewBox="0 0 24 24">
                <path d="M3 21h18M5 21V10l7-5 7 5v11" />
              </svg>
            </div>
            <div className={styles.actionRowBody}>
              <div className={styles.actionRowT}>{row.t}</div>
              <div
                className={styles.actionRowD}
                dangerouslySetInnerHTML={{ __html: row.d }}
              />
            </div>
            <span className={styles.actionRowArrow}>→</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
