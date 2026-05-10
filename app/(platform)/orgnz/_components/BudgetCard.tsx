import styles from "../dashboard.module.css";

type LineItem = {
  label: string;
  amount_cents: number;
};

type Props = {
  budgetCents: number | null;
  contingencyPct: number | null;
  lineItems: LineItem[];
};

function fmtMoney(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

const SWATCH_COLORS = ["var(--teal)", "var(--amber)", "var(--rose)", "var(--violet)"];

export function BudgetCard({ budgetCents, contingencyPct, lineItems }: Props) {
  const allocated = lineItems.reduce((sum, item) => sum + item.amount_cents, 0);
  const allocatedPct = budgetCents
    ? Math.min(100, Math.round((allocated / budgetCents) * 100))
    : 0;

  // Top 4 categories by amount for the lower row
  const topItems = [...lineItems]
    .sort((a, b) => b.amount_cents - a.amount_cents)
    .slice(0, 4);

  const contingencyCents = budgetCents && contingencyPct
    ? Math.round(budgetCents * (contingencyPct / 100))
    : 0;

  return (
    <div className={styles.budgetCard}>
      <div className={styles.bgtHdr}>
        <div>
          <span className={styles.bgtTot}>
            {budgetCents ? fmtMoney(budgetCents) : "—"}
          </span>
          <span className={styles.bgtOf}>total budget</span>
        </div>
        <div className={styles.bgtPct}>
          {allocatedPct}% allocated
          {contingencyPct ? ` · ${contingencyPct}% contingency` : ""}
        </div>
      </div>
      <div className={styles.bgtTrack}>
        <div className={styles.bgtA} style={{ width: `${allocatedPct}%`, left: 0 }} />
      </div>
      <div className={styles.bgtRows}>
        {topItems.length === 0 ? (
          <p className={styles.brL} style={{ gridColumn: "1 / -1" }}>
            No line items yet — re-run the calculator to seed your breakdown.
          </p>
        ) : (
          topItems.map((item, i) => (
            <div key={item.label + i} className={styles.br}>
              <div
                className={styles.brDot}
                style={{ background: SWATCH_COLORS[i % SWATCH_COLORS.length] }}
              />
              <div className={styles.brL}>{item.label}</div>
              <div className={styles.brV}>{fmtMoney(item.amount_cents)}</div>
            </div>
          ))
        )}
        {contingencyCents > 0 ? (
          <div className={styles.br}>
            <div className={styles.brDot} style={{ background: "rgba(255,255,255,0.18)" }} />
            <div className={styles.brL}>Contingency</div>
            <div className={styles.brV}>{fmtMoney(contingencyCents)}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
