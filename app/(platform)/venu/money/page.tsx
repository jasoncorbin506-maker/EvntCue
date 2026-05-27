import Link from "next/link";
import { redirect } from "next/navigation";
import { Chrome, LivePill, ChromeSignOut } from "../_components/Chrome";
import { commissionFlowLabel } from "@/lib/labels/commission-flows";
import { formatUSDCents } from "../_lib/demo-data";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import { getVenueMoney, isValidPeriod, type MoneyPeriod } from "@/lib/venu/money";
import s from "../venu.module.css";

/**
 * Venu Money tab — wire-DB.
 *
 * Period segment is URL-param-driven (`?period=this-month|ytd|all-time`) so
 * segments are real links — deep-linkable, refresh-safe, no client state.
 * Default is "This month."
 *
 * "Trends" segment renders disabled (charts feature, post-Phase 4).
 *
 * Breakdown aggregates from `bookings` columns directly. Per-flow detail
 * via `commission_flows` lands when those rows populate (Phase 4 Stripe).
 */

const SEGMENT_DEFS: Array<{
  key: MoneyPeriod | "trends";
  label: string;
  disabled?: true;
}> = [
  { key: "this-month", label: "This month" },
  { key: "ytd", label: "YTD" },
  { key: "all-time", label: "All time" },
  { key: "trends", label: "Trends", disabled: true },
];

export default async function VenuMoney({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const venue = await getCurrentVenue();
  if (!venue) redirect("/venues");

  const { period: periodParam } = await searchParams;
  const activePeriod: MoneyPeriod = isValidPeriod(periodParam) ? periodParam : "this-month";

  const money = await getVenueMoney(venue.tenantId, activePeriod);

  // Period-context line under the hero number — varies by which period the
  // user is looking at, kept honest (no fake "+18% vs April" delta until
  // historical-period comparison wires for real).
  const periodContext =
    activePeriod === "this-month"
      ? `${money.bookingCount} ${money.bookingCount === 1 ? "booking" : "bookings"} this month`
      : activePeriod === "ytd"
        ? `${money.bookingCount} ${money.bookingCount === 1 ? "booking" : "bookings"} year-to-date`
        : `${money.bookingCount} ${money.bookingCount === 1 ? "booking" : "bookings"} all-time`;

  // Breakdown rows derived from the aggregation. Outgoing flows (platform
  // fee, referrals, commissions) render muted + with minus sign per the
  // original mockup convention. Zero-cents rows omitted to keep the surface
  // honest — no fake placeholder rows for flows that don't exist yet.
  const rows: Array<{ name: string; cents: number; muted?: boolean; minus?: boolean }> = [];
  if (money.grossRevenueCents > 0) {
    rows.push({ name: "Gross revenue", cents: money.grossRevenueCents });
  }
  if (money.platformFeeCents > 0) {
    rows.push({
      name: commissionFlowLabel.platform_fee,
      cents: -money.platformFeeCents,
      muted: true,
      minus: true,
    });
  }
  if (money.vendorReferralPaidCents > 0) {
    rows.push({
      name: `${commissionFlowLabel.venue_referral} paid`,
      cents: -money.vendorReferralPaidCents,
      muted: true,
      minus: true,
    });
  }
  if (money.commissionPaidCents > 0) {
    rows.push({
      name: "Other commissions paid",
      cents: -money.commissionPaidCents,
      muted: true,
      minus: true,
    });
  }

  return (
    <>
      <Chrome
        venueName={venue.displayName}
        roleLabel="Money"
        right={
          <>
            <LivePill />
            <ChromeSignOut />
          </>
        }
        backHref="/venu/discover"
      />

      {/* Hero number */}
      <section className={s.moneyHero}>
        <div className={s.moneyEyebrow}>{money.periodLabel} · Net revenue</div>
        <div className={s.moneyBig}>
          {formatUSDCents(money.netRevenueCents).replace(/\.\d+$/, "")}
          <span className={s.moneyBigCents}>.00</span>
        </div>
        <div className={s.moneyPeriod}>{periodContext}</div>
      </section>

      {/* Period segments — URL-param links */}
      <div className={s.moneyTabs} role="tablist" aria-label="Money period">
        {SEGMENT_DEFS.map((seg) => {
          const isActive = !seg.disabled && seg.key === activePeriod;
          const cls = `${s.moneyTab} ${isActive ? s.moneyTabActive : ""}`;
          if (seg.disabled) {
            return (
              <span
                key={seg.key}
                role="tab"
                aria-disabled="true"
                className={cls}
                style={{ opacity: 0.4, cursor: "default" }}
              >
                {seg.label}
              </span>
            );
          }
          return (
            <Link
              key={seg.key}
              href={`/venu/money?period=${seg.key}`}
              role="tab"
              aria-selected={isActive}
              className={cls}
            >
              {seg.label}
            </Link>
          );
        })}
      </div>

      {/* Breakdown */}
      <section className={s.breakdown}>
        {rows.length === 0 ? (
          <div className={s.emptyStateInline}>
            No revenue {activePeriod === "this-month" ? "this month" : activePeriod === "ytd" ? "year-to-date" : "yet"}.
          </div>
        ) : (
          <>
            {rows.map((row) => (
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
              <div className={s.bdVal}>{formatUSDCents(money.netRevenueCents)}</div>
            </div>
          </>
        )}
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
