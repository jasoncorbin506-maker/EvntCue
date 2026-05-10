import styles from "../dashboard.module.css";

// Phase 3.2 ships this empty. Real Cue-generated checklists land in Phase 3.4
// when CueService can derive tasks from event subtype + lead time.
export function ChecklistCard() {
  return (
    <div className={styles.emptyCard}>
      <h3 className={styles.emptyCardTitle}>Your week, by Cue.</h3>
      <p className={styles.emptyCardBody}>
        Once your venue is locked, Cue builds a week-by-week checklist tailored
        to your event type and lead time — research-backed milestones, vendor
        deadlines, paperwork. Coming with the venue flow.
      </p>
    </div>
  );
}
