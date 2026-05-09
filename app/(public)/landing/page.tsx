import styles from "./landing.module.css";
import { RoleStack } from "./RoleStack";

export const metadata = {
  title: "EvntCue — Begin",
  description: "Whether you're throwing it, working it, or hosting it — start here.",
};

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.frame}>
          <div className={styles.logoStage}>
            <svg
              className={styles.bgConstellation}
              viewBox="0 0 480 170"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <line x1="240" y1="85" x2="80"  y2="32"  stroke="rgba(212,119,138,0.20)" strokeWidth="0.6" strokeDasharray="3 6" />
              <line x1="240" y1="85" x2="400" y2="32"  stroke="rgba(232,98,42,0.20)"   strokeWidth="0.6" strokeDasharray="3 6" />
              <line x1="240" y1="85" x2="240" y2="148" stroke="rgba(42,107,219,0.20)"  strokeWidth="0.6" strokeDasharray="3 6" />
              <line x1="80"  y1="32" x2="400" y2="32"  stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" strokeDasharray="2 8" />
              <line x1="80"  y1="32" x2="240" y2="148" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" strokeDasharray="2 8" />
              <line x1="400" y1="32" x2="240" y2="148" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" strokeDasharray="2 8" />
              <circle cx="80"  cy="32"  r="2.8" fill="rgba(212,119,138,0.32)" />
              <circle cx="80"  cy="32"  r="1.3" fill="#E8A0B0" opacity="0.75" />
              <circle cx="400" cy="32"  r="2.8" fill="rgba(232,98,42,0.32)" />
              <circle cx="400" cy="32"  r="1.3" fill="#F5A882" opacity="0.75" />
              <circle cx="240" cy="148" r="2.8" fill="rgba(42,107,219,0.32)" />
              <circle cx="240" cy="148" r="1.3" fill="#7EB3F5" opacity="0.75" />
            </svg>
            <div className={styles.centerRing} />
            <div className={styles.centerRing2} />
            <div className={styles.logo}>
              <div className={styles.logoLine}>
                <span className={styles.logoEvnt}>Evnt</span>
                <span className={styles.logoCue}>Cue</span>
              </div>
              <div className={styles.tagline}>AI · Bringing people together</div>
            </div>
          </div>

          <p className={styles.sub}>
            Whether you&rsquo;re throwing it, working it, or hosting it &mdash; start here.
          </p>

          <RoleStack />

          <div className={styles.foot}>DFW · Texas · 2026</div>
        </div>
      </div>
    </main>
  );
}
