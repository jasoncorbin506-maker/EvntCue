"use client";

import styles from "../../orgnz.module.css";
import { Sheet } from "../Sheet";
import { showToast } from "../../_lib/toast";
import { openPadrino } from "../../_lib/sheet";
import type { BenchmarkRow } from "../../_lib/benchmarks";

export type BudgetSheetData = {
  spentCents: number;
  budgetCents: number;
  escrowCents: number;
  paidOutCents: number;
  guestCount: number;
  categoryLabel: string;
  benchmarks: BenchmarkRow[];
  benchmarkSummaryPct: number; // signed; overall variance vs DFW median
  benchmarkSummaryState: "under" | "over" | "match";
  lineItems: { label: string; amount_cents: number }[];
};

function dollarsFull(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function dollarsCompact(cents: number): string {
  if (cents >= 100_000_00) return `$${Math.round(cents / 100_000_00)}M`;
  if (cents >= 10_000_00) return `$${Math.round(cents / 100_000)}K`;
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function signedPct(pct: number): string {
  const rounded = Math.round(pct * 100);
  if (rounded === 0) return "at median";
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

function pctClass(state: "under" | "over" | "match"): string {
  if (state === "under") return styles.pctUnder;
  if (state === "over") return styles.pctOver;
  return styles.pctMatch;
}

function barClass(state: "under" | "over" | "match"): string {
  if (state === "under") return styles.barUnder;
  if (state === "over") return styles.barOver;
  return "";
}

/** Bar fill width: median sits at 50%, user's amount scales relative to that. */
function fillWidth(yourCents: number, medianCents: number): number {
  if (medianCents <= 0) return 0;
  const ratio = yourCents / medianCents;
  // 50% width = match, cap at 100% so very-over doesn't overflow visually
  const pct = Math.min(100, Math.max(0, ratio * 50));
  return pct;
}

type Props = {
  open: boolean;
  onClose: () => void;
  data: BudgetSheetData;
};

export function BudgetSheet({ open, onClose, data }: Props) {
  const pct = data.budgetCents > 0 ? (data.spentCents / data.budgetCents) * 100 : 0;
  const summaryCopy =
    data.benchmarkSummaryState === "match"
      ? `Tracking <em>at the median</em> for your category.`
      : data.benchmarkSummaryState === "under"
      ? `Tracking <em>${Math.abs(Math.round(data.benchmarkSummaryPct * 100))}% under typical</em> for your category.`
      : `Tracking <em>${Math.round(data.benchmarkSummaryPct * 100)}% over typical</em> for your category.`;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="Budget"
      eyebrowAccent="gold"
      title={
        <>
          Where the money <em>moves</em>
        </>
      }
    >
      <div className={styles.sheetHero}>
        <div className={styles.sheetHeroL}>Spent of total</div>
        <div className={styles.sheetHeroV}>
          <em>$</em>
          {(data.spentCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </div>
        <div className={styles.sheetHeroOf}>
          of <em>{dollarsFull(data.budgetCents)}</em> budget
        </div>
        <div className={styles.sheetHeroBar}>
          <div className={styles.sheetHeroBarFill} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <div className={styles.sheetHeroSplit}>
          <span>
            <span className={styles.sheetHeroSplitV}>{dollarsFull(data.escrowCents)}</span>{" "}
            in escrow
          </span>
          <span>
            <span className={styles.sheetHeroSplitV}>{dollarsFull(data.paidOutCents)}</span>{" "}
            paid out
          </span>
        </div>
      </div>

      <div className={styles.cueBench}>
        <div className={styles.cueBenchEye}>Cue&rsquo;s read · DFW market</div>
        <div className={styles.cueBenchTitle}>
          Across <em>{data.guestCount}-guest {data.categoryLabel}s in DFW</em>, here&rsquo;s how your spend compares.
        </div>
        <div className={styles.cueBenchGrid}>
          {data.benchmarks.map((row) => (
            <div key={row.label} className={styles.cueBenchRow}>
              <div className={styles.cueBenchRowL}>
                <div className={styles.cueBenchRowCat}>{row.label}</div>
                <div className={styles.cueBenchRowSub}>
                  {dollarsFull(row.yourCents)} · median <em>{dollarsFull(row.medianCents)}</em>
                </div>
              </div>
              <div className={styles.cueBenchBar}>
                <div className={styles.cueBenchBarMedian} style={{ left: "50%" }} />
                <div
                  className={`${styles.cueBenchBarFill} ${barClass(row.state)}`}
                  style={{ width: `${fillWidth(row.yourCents, row.medianCents)}%` }}
                />
              </div>
              <span className={`${styles.cueBenchRowPct} ${pctClass(row.state)}`}>
                {row.state === "match" ? "at median" : signedPct(row.pctVsMedian)}
              </span>
            </div>
          ))}
          <div className={`${styles.cueBenchRow} ${styles.cueBenchRowPlatform}`}>
            <div className={styles.cueBenchRowL}>
              <div className={styles.cueBenchRowCat}>Cue · EvntCue platform</div>
              <div className={styles.cueBenchRowSub}>
                2.5% of vendor flow · $19.99/mo Cue Premium · <em>placeholder pricing</em>
              </div>
            </div>
            <div className={styles.cueBenchBar}>
              <div className={styles.cueBenchBarMedian} style={{ left: "50%" }} />
              <div
                className={`${styles.cueBenchBarFill} ${styles.barPlatform}`}
                style={{ width: "48%" }}
              />
            </div>
            <span className={`${styles.cueBenchRowPct} ${styles.pctMatch}`}>~2%</span>
          </div>
        </div>
        <div
          className={styles.cueBenchFoot}
          dangerouslySetInnerHTML={{
            __html: `${summaryCopy} The Cue line is the platform&rsquo;s own cost — same transparency we ask of every vendor on the list.`,
          }}
        />
      </div>

      <div className={styles.actionGrid}>
        <button type="button" className={styles.actionBtn} onClick={() => openPadrino(true)}>
          <span className={styles.actionBtnIco}>
            <svg viewBox="0 0 24 24">
              <path d="M12 21s-7-4.5-7-10a5 5 0 019-3 5 5 0 019 3c0 5.5-7 10-7 10z" />
            </svg>
          </span>
          <span className={styles.actionBtnT}>Invite a contribution</span>
          <span className={styles.actionBtnD}>Padrino · grandparents · family</span>
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnAlt}`}
          onClick={() => showToast("Stripe Connect setup lands in <em>Phase 4</em>.")}
        >
          <span className={styles.actionBtnIco}>
            <svg viewBox="0 0 24 24">
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18M7 15h4" />
            </svg>
          </span>
          <span className={styles.actionBtnT}>Stripe Connect</span>
          <span className={styles.actionBtnD}>Payouts · receipts · refunds</span>
        </button>
      </div>

      <div className={styles.sectionL}>Line items</div>
      {data.lineItems.length > 0 ? (
        <>
          {data.lineItems.map((item) => (
            <div key={item.label} className={styles.li}>
              <div className={styles.liIco}>
                <svg viewBox="0 0 24 24">
                  <path d="M3 6h18M3 12h18M3 18h12" />
                </svg>
              </div>
              <div className={styles.liBody}>
                <div className={styles.liT}>{item.label}</div>
                <div className={styles.liMeta}>
                  <em className="due">Allocated</em> · not yet booked
                </div>
              </div>
              <div className={styles.liAmt}>
                <em>$</em>
                {dollarsCompact(item.amount_cents).replace("$", "")}
              </div>
            </div>
          ))}
          <div className={`${styles.li} ${styles.liPlatform}`}>
            <div className={styles.liIco}>
              <svg viewBox="0 0 24 24">
                <path d="M12 3l2.5 6.5L21 11l-5 4 1.5 7L12 18.5 6.5 22 8 15l-5-4 6.5-1.5L12 3z" />
              </svg>
            </div>
            <div className={styles.liBody}>
              <div className={styles.liT}>Cue · EvntCue platform</div>
              <div className={styles.liMeta}>2.5% platform fee + $19.99/mo (placeholder)</div>
            </div>
            <div className={styles.liAmt}>
              <em>—</em>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.sheetEmpty}>
          <div className={styles.sheetEmptyT}>
            <em>No line items yet.</em>
          </div>
          <div className={styles.sheetEmptyB}>
            Re-run the budget calculator to seed your allocations.
          </div>
        </div>
      )}
    </Sheet>
  );
}
