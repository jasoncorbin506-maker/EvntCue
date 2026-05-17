import { Chrome, LivePill } from "../_components/Chrome";
import { commissionFlowLabel } from "@/lib/labels/commission-flows";
import { formatUSDCents } from "../_lib/demo-data";
import s from "../venu.module.css";

/**
 * Venu Money tab — chunk C visual port.
 *
 * Per Venu_Locked_2026-05-13.md row 5: hero take-home number, segmented
 * period control, breakdown, Pro hint at bottom.
 *
 * Lock 14b register fix applied: "Take-home" replaced with "Net revenue"
 * throughout. Carries the terminology shift forward from chunk A's tile
 * copy fix. Numbers are stub for chunk C; real reads aggregate from
 * `bookings` + `commission_flows` in a later chunk.
 *
 * Source mockup: Screen 3 (lines ~729–823).
 *
 * Period segments are visual-only for chunk C (no filter wiring) — "This
 * month" stays active. Real period switching is post-DB-wire.
 */

// Stub breakdown rows. Real reads sum from commission_flows + bookings.
const BREAKDOWN_ROWS: Array<{ name: string; cents: number; muted?: boolean; minus?: boolean }> = [
  { name: commissionFlowLabel.venue_in_house, cents: 1_840_000 },
  { name: `${commissionFlowLabel.venue_fb_surcharge} captured`, cents: 792_000 },
  { name: `${commissionFlowLabel.venue_kickback}s received`, cents: 126_000 },
  { name: commissionFlowLabel.platform_fee, cents: -68_000, muted: true, minus: true },
  { name: `${commissionFlowLabel.venue_referral} paid`, cents: -272_000, muted: true, minus: true },
];

const NET_REVENUE_CENTS = BREAKDOWN_ROWS.reduce((sum, r) => sum + r.cents, 0);

const SEGMENTS = ["This event", "This month", "YTD", "Trends"] as const;
const ACTIVE_SEGMENT = "This month";

export default function VenuMoney() {
  return (
    <>
      <Chrome venueName="The Lantern Hall" roleLabel="Money" right={<LivePill />} backHref="/venu/discover" />

      {/* Hero number */}
      <section className={s.moneyHero}>
        <div className={s.moneyEyebrow}>May · Net revenue</div>
        <div className={s.moneyBig}>
          {formatUSDCents(NET_REVENUE_CENTS).replace(/\.\d+$/, "")}
          <span className={s.moneyBigCents}>.00</span>
        </div>
        <div className={s.moneyDelta}>+18% vs April</div>
        <div className={s.moneyPeriod}>Through May 17</div>
      </section>

      {/* Period segments */}
      <div className={s.moneyTabs} role="tablist" aria-label="Money period">
        {SEGMENTS.map((seg) => (
          <button
            key={seg}
            type="button"
            role="tab"
            aria-selected={seg === ACTIVE_SEGMENT}
            className={`${s.moneyTab} ${seg === ACTIVE_SEGMENT ? s.moneyTabActive : ""}`}
          >
            {seg}
          </button>
        ))}
      </div>

      {/* Breakdown */}
      <section className={s.breakdown}>
        {BREAKDOWN_ROWS.map((row) => (
          <div key={row.name} className={s.bdRow}>
            <div className={`${s.bdName} ${row.muted ? s.bdMuted : ""}`}>{row.name}</div>
            <div
              className={`${s.bdVal} ${row.muted ? s.bdValMuted : ""} ${row.minus ? s.bdValMinus : ""}`}
            >
              {row.minus ? "−" : ""}
              {formatUSDCents(Math.abs(row.cents))}
            </div>
          </div>
        ))}
        <div className={`${s.bdRow} ${s.bdRowTotal}`}>
          <div className={s.bdName}>Net revenue</div>
          <div className={s.bdVal}>{formatUSDCents(NET_REVENUE_CENTS)}</div>
        </div>
      </section>

      {/* Pro hint */}
      <button type="button" className={s.moneyProHint}>
        <div className={s.moneyProHintIco}>
          <svg viewBox="0 0 24 24">
            <path d="M3 3v18h18" />
            <path d="M7 17l3-5 4 2 5-9" />
            <circle cx="7" cy="17" r="1.5" />
            <circle cx="10" cy="12" r="1.5" />
            <circle cx="14" cy="14" r="1.5" />
            <circle cx="19" cy="5" r="1.5" />
          </svg>
        </div>
        <div className={s.moneyProHintBody}>
          <div className={s.moneyProHintLbl}>Pro · Deeper reports</div>
          <div className={s.moneyProHintName}>Source attribution, YoY trends, CSV exports</div>
          <div className={s.moneyProHintSub}>
            See where each booking came from. Compare years. Export to your accountant.
          </div>
        </div>
        <div className={s.eventActionArrow}>›</div>
      </button>
    </>
  );
}
