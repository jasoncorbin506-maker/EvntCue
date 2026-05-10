import { Countdown } from "./Countdown";
import styles from "../orgnz.module.css";

type Props = {
  title: string;
  subtitle: string | null;
  targetIso: string | null;
  dateLabel: string | null;
};

export function Topbar({ title, subtitle, targetIso, dateLabel }: Props) {
  return (
    <div className={styles.topbar}>
      <div className={styles.tbL}>
        <div className={styles.tbT}>{title}</div>
        {subtitle ? <div className={styles.tbS}>{subtitle}</div> : null}
      </div>
      <div className={styles.tbR}>
        {targetIso ? (
          <div className={styles.cd}>
            <Countdown targetIso={targetIso} />
            {dateLabel ? <span className={styles.cdDate}>{dateLabel}</span> : null}
          </div>
        ) : null}
        <button type="button" className={styles.cueBtn}>
          {/* Cue voice indicator — rose-only, not the platform mark */}
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
          Ask Cue
        </button>
      </div>
    </div>
  );
}
