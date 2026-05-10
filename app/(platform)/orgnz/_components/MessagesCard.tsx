import styles from "../dashboard.module.css";

export function MessagesCard() {
  return (
    <div className={styles.emptyCard}>
      <h3 className={styles.emptyCardTitle}>No messages yet.</h3>
      <p className={styles.emptyCardBody}>
        Conversations with your Plnr, vendors, and venue team land here. Reach
        out from any vendor card to start a thread — every reply is logged
        against your event for the run-of-show.
      </p>
    </div>
  );
}
