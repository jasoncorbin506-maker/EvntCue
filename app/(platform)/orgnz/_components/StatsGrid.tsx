import styles from "../dashboard.module.css";

type Props = {
  budgetCents: number | null;
  allocatedCents: number;
  lineItemCount: number;
  guestCount: number | null;
};

function fmtMoney(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

export function StatsGrid({
  budgetCents,
  allocatedCents,
  lineItemCount,
  guestCount,
}: Props) {
  const budgetPct = budgetCents
    ? Math.min(100, Math.round((allocatedCents / budgetCents) * 100))
    : 0;

  return (
    <div className={styles.stats}>
      <div className={styles.stat}>
        <p className={styles.statL}>Budget allocated</p>
        <div className={styles.statV}>{budgetPct}%</div>
        <p className={styles.statS}>
          {budgetCents
            ? `${fmtMoney(allocatedCents)} of ${fmtMoney(budgetCents)}`
            : "Set your budget to track"}
        </p>
        <div className={styles.statBar}>
          <div
            className={styles.statBf}
            style={{
              width: `${budgetPct}%`,
              background: "linear-gradient(90deg,var(--teal),#1A9E82)",
            }}
          />
        </div>
      </div>

      <div className={styles.stat}>
        <p className={styles.statL}>Vendors confirmed</p>
        <div className={styles.statV}>0/0</div>
        <p className={styles.statS}>Browse the marketplace to start</p>
        <div className={styles.statBar}>
          <div
            className={styles.statBf}
            style={{ width: "0%", background: "var(--rose)" }}
          />
        </div>
      </div>

      <div className={styles.stat}>
        <p className={styles.statL}>Categories planned</p>
        <div className={styles.statV}>{lineItemCount}</div>
        <p className={styles.statS}>From your calculator estimate</p>
        <div className={styles.statBar}>
          <div
            className={styles.statBf}
            style={{
              width: `${Math.min(100, lineItemCount * 10)}%`,
              background: "linear-gradient(90deg,var(--amber),var(--at))",
            }}
          />
        </div>
      </div>

      <div className={styles.stat}>
        <p className={styles.statL}>Guests</p>
        <div className={styles.statV}>{guestCount ?? "—"}</div>
        <p className={styles.statS}>RSVPs unlock with guest features</p>
        <div className={styles.statBar}>
          <div
            className={styles.statBf}
            style={{ width: "0%", background: "var(--violet)" }}
          />
        </div>
      </div>
    </div>
  );
}
