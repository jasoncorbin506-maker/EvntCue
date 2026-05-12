"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "../orgnz.module.css";
import { showToast } from "../_lib/toast";
import { openSheet } from "../_lib/sheet";

type Props = {
  budgetCents: number | null;
  allocatedCents: number;
  vendorCount: number;
  moodImageCount: number;
  guestRsvpIn: number | null;
  guestTotal: number | null;
  hasPlnr: boolean;
  hasVenu: boolean;
  isPaidTier: boolean;
};

function dollars(cents: number): string {
  // Work in dollars so the thresholds read clearly.
  // (Prior version used cents thresholds with off-by-100 errors that
  // rendered $60K budgets as "$6M". Not aspirational — just broken math.)
  const d = cents / 100;
  if (d >= 1_000_000) {
    return `$${(d / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (d >= 10_000) return `$${Math.round(d / 1000)}K`;
  return `$${d.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function TileGrid(props: Props) {
  const t = useTranslations("dashboard");
  const {
    budgetCents,
    allocatedCents,
    vendorCount,
    moodImageCount,
    guestRsvpIn,
    guestTotal,
    hasPlnr,
    hasVenu,
    isPaidTier,
  } = props;

  const budgetTotal = budgetCents ?? 0;
  const budgetSpent = allocatedCents;

  return (
    <section className={styles.tiles}>
      {/* BUDGET — free */}
      <button
        type="button"
        className={`${styles.tile} ${styles.tileBudget}`}
        onClick={() => openSheet("budget")}
      >
        <div className={styles.tileH}>
          <div className={styles.tileIco}>
            <svg viewBox="0 0 24 24">
              <path d="M3 6h18M3 12h18M3 18h18M7 9v6M17 9v6" />
            </svg>
          </div>
          <span className={styles.tileArrow}>→</span>
        </div>
        <div className={styles.tileL}>{t("tileBudget")}</div>
        <div className={styles.tileV}>
          {budgetTotal > 0 ? dollars(budgetSpent) : t("tileBudgetEmpty")}
          {budgetTotal > 0 && <em>/ {dollars(budgetTotal)}</em>}
        </div>
        <div className={styles.tileD}>
          {budgetTotal > 0
            ? allocatedCents === 0
              ? t("tileBudgetAllocateFirst")
              : t("tileBudgetAllocated", { pct: Math.round((allocatedCents / budgetTotal) * 100) })
            : t("tileBudgetRunCalc")}
        </div>
      </button>

      {/* VENDORS — free (browse) */}
      <button
        type="button"
        className={`${styles.tile} ${styles.tileVendors}`}
        onClick={() => openSheet("vendors")}
      >
        <div className={styles.tileH}>
          <div className={styles.tileIco}>
            <svg viewBox="0 0 24 24">
              <circle cx="9" cy="9" r="3" />
              <path d="M3 19a6 6 0 0112 0M16 11l2 2 4-4" />
            </svg>
          </div>
          <span className={styles.tileArrow}>→</span>
        </div>
        <div className={styles.tileL}>{t("tileVendors")}</div>
        <div className={styles.tileV}>
          {vendorCount > 0 ? (
            <>
              {vendorCount}
              <em>{t("tileVendorsBooked")}</em>
            </>
          ) : (
            t("tileVendorsFind")
          )}
        </div>
        <div className={styles.tileD}>
          {vendorCount === 0 ? t("tileVendorsLock") : t("tileVendorsStatus")}
        </div>
      </button>

      {/* MOOD — free */}
      <Link href="/orgnz/mood-board" className={`${styles.tile} ${styles.tileMood}`}>
        <div className={styles.tileH}>
          <div className={styles.tileIco}>
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="8" height="8" rx="1" />
              <rect x="13" y="3" width="8" height="5" rx="1" />
              <rect x="13" y="10" width="8" height="11" rx="1" />
              <rect x="3" y="13" width="8" height="8" rx="1" />
            </svg>
          </div>
          <span className={styles.tileArrow}>→</span>
        </div>
        <div className={styles.tileL}>{t("tileMood")}</div>
        <div className={styles.tileV}>
          {moodImageCount > 0 ? (
            <>
              {moodImageCount}
              <em>{t("tileMoodImages")}</em>
            </>
          ) : (
            t("tileMoodStart")
          )}
        </div>
        <div className={styles.tileD}>
          {moodImageCount === 0 ? t("tileMoodPin") : t("tileMoodCurator")}
        </div>
      </Link>

      {/* GUESTS — paywalled (PARKING_LOT #19: full-tile gate, locked 2026-05-11) */}
      {isPaidTier ? (
        <button
          type="button"
          className={`${styles.tile} ${styles.tileGuests}`}
          onClick={() => openSheet("guests")}
        >
          <div className={styles.tileH}>
            <div className={styles.tileIco}>
              <svg viewBox="0 0 24 24">
                <circle cx="9" cy="8" r="3" />
                <circle cx="17" cy="9" r="2" />
                <path d="M3 19a6 6 0 0112 0M14 19a4 4 0 017-2.5" />
              </svg>
            </div>
            <span className={styles.tileArrow}>→</span>
          </div>
          <div className={styles.tileL}>{t("tileGuests")}</div>
          <div className={styles.tileV}>
            {guestRsvpIn ?? 0}
            {guestTotal != null && <em>/ {guestTotal}</em>}
          </div>
          <div className={styles.tileD}>
            {guestTotal && guestRsvpIn != null
              ? t("tileGuestsRsvpd", { pct: Math.round((guestRsvpIn / guestTotal) * 100) })
              : t("tileGuestsSendStd")}
          </div>
        </button>
      ) : (
        <button
          type="button"
          className={`${styles.tile} ${styles.tileGuests} ${styles.tileLocked}`}
          onClick={() => showToast(t("tileGuestsUpgradeToast"))}
        >
          <div className={styles.tileH}>
            <div className={styles.tileIco}>
              <svg viewBox="0 0 24 24">
                <circle cx="9" cy="8" r="3" />
                <circle cx="17" cy="9" r="2" />
                <path d="M3 19a6 6 0 0112 0M14 19a4 4 0 017-2.5" />
              </svg>
            </div>
            <span className={styles.tileLockedBadge}>{t("tileGuestsPremium")}</span>
          </div>
          <div className={styles.tileL}>{t("tileGuests")}</div>
          <div className={styles.tileV}>
            {guestTotal != null ? (
              <>
                {guestTotal}
                <em>{t("tileGuestsInvites")}</em>
              </>
            ) : (
              t("tileGuestsManage")
            )}
          </div>
          <div className={styles.tileLockCta}>{t("tileGuestsUpgrade")}</div>
        </button>
      )}

      {/* PLNR — free (browse) */}
      <button
        type="button"
        className={`${styles.tile} ${styles.tilePlnr}`}
        onClick={() => openSheet("plnr")}
      >
        <div className={styles.tileH}>
          <div className={styles.tileIco}>
            <svg viewBox="0 0 24 24">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <span className={styles.tileArrow}>→</span>
        </div>
        <div className={styles.tileL}>{t("tilePlnr")}</div>
        <div className={styles.tileV}>{hasPlnr ? t("tilePlnrBooked") : t("tilePlnrFind")}</div>
        <div className={styles.tileD}>
          {hasPlnr ? t("tilePlnrDayOf") : t("tilePlnrBrowse")}
        </div>
      </button>

      {/* VENU — free (browse) */}
      <button
        type="button"
        className={`${styles.tile} ${styles.tileVenu}`}
        onClick={() => openSheet("venu")}
      >
        <div className={styles.tileH}>
          <div className={styles.tileIco}>
            <svg viewBox="0 0 24 24">
              <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />
            </svg>
          </div>
          <span className={styles.tileArrow}>→</span>
        </div>
        <div className={styles.tileL}>{t("tileVenu")}</div>
        <div className={styles.tileV}>{hasVenu ? t("tileVenuLocked") : t("tileVenuPick")}</div>
        <div className={styles.tileD}>
          {hasVenu ? t("tileVenuContract") : t("tileVenuBrowse")}
        </div>
      </button>
    </section>
  );
}
