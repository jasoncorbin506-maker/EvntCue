import Link from "next/link";
import styles from "../dashboard.module.css";

type Props = {
  eventType: string | null;
  daysOut: number | null;
};

// Phase 3.4 will replace this with CueService.ts. For 3.2 we render a static
// welcome that's calibrated to the user's lead time + event category. Warning
// tone but never blocking, per memory feedback_evntcue_warnings_not_blockers.
function makeMessage(eventType: string | null, daysOut: number | null): string {
  if (daysOut == null) {
    return "I'll have more to say once your event date is locked. For now: start with your visual brief — pinning your aesthetic early makes every vendor decision faster.";
  }

  if (daysOut < 60) {
    return `Tight window — ${daysOut} days out. Most DFW venues need 3–6 months but I'll work the gaps. Lock the venue this week so vendors can sequence around it. You can still proceed without one, but Cue can't sequence vendors until the date is real.`;
  }
  if (daysOut < 180) {
    return `${daysOut} days gives you room, but the venue still needs to come first — vendors gate on the venue confirmation. Build your visual brief while you tour spaces; that way every vendor I match later is anchored to your aesthetic.`;
  }
  return `${daysOut} days out — plenty of runway. Use this stretch to lock your aesthetic and tour venues without rushing. The earliest meaningful decision is the venue; everything else sequences from there.`;
}

export function CuePanel({ eventType, daysOut }: Props) {
  const message = makeMessage(eventType, daysOut);

  return (
    <div className={styles.cuePanel}>
      <div className={styles.cpIco}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <line x1="5" y1="2" x2="9" y2="3.5" stroke="#D4778A" strokeWidth="0.9" />
          <line x1="9" y1="3.5" x2="9" y2="8" stroke="#D4778A" strokeWidth="0.9" />
          <line x1="9" y1="8" x2="5" y2="9.5" stroke="#D4778A" strokeWidth="0.9" />
          <line x1="5" y1="9.5" x2="2" y2="6" stroke="#D4778A" strokeWidth="0.9" />
          <line x1="2" y1="6" x2="5" y2="2" stroke="#D4778A" strokeWidth="0.9" />
          <circle cx="9" cy="3.5" r="1.1" fill="#D4778A" />
          <circle cx="9" cy="8" r="1.1" fill="#D4778A" />
          <circle cx="5" cy="9.5" r="1.1" fill="#D4778A" />
          <circle cx="2" cy="6" r="1.1" fill="#D4778A" />
          <circle cx="5" cy="2" r="1.7" fill="#E8A0B0" />
          <circle cx="5" cy="2" r="0.8" fill="#F2C8D4" />
        </svg>
      </div>
      <div className={styles.cpBody}>
        <p className={styles.cpLbl}>Cue</p>
        <p className={styles.cpTxt}>{message}</p>
        <div className={styles.cpActs}>
          <Link href="/orgnz/mood-board" className={styles.cpb}>
            Start visual brief →
          </Link>
          <span className={styles.cpb} style={{ opacity: 0.5, cursor: "default" }}>
            Browse venues — soon
          </span>
        </div>
      </div>
    </div>
  );
}
