"use client";

import Link from "next/link";
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
  if (cents >= 1_000_000) return `$${Math.round(cents / 100_000) / 10}M`;
  if (cents >= 1_000_00) return `$${Math.round(cents / 100_000)}K`;
  if (cents >= 10_000) return `$${Math.round(cents / 1000)}K`;
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function TileGrid(props: Props) {
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
        <div className={styles.tileL}>Budget</div>
        <div className={styles.tileV}>
          {budgetTotal > 0 ? dollars(budgetSpent) : "—"}
          {budgetTotal > 0 && <em>/ {dollars(budgetTotal)}</em>}
        </div>
        <div className={styles.tileD}>
          {budgetTotal > 0
            ? allocatedCents === 0
              ? "Allocate your first line item"
              : `${Math.round((allocatedCents / budgetTotal) * 100)}% allocated`
            : "Run the calculator first"}
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
        <div className={styles.tileL}>Vendors</div>
        <div className={styles.tileV}>
          {vendorCount > 0 ? (
            <>
              {vendorCount}
              <em>booked</em>
            </>
          ) : (
            "Find your team"
          )}
        </div>
        <div className={styles.tileD}>
          {vendorCount === 0 ? "Lock the venue first" : "View status & quotes"}
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
        <div className={styles.tileL}>Mood Board</div>
        <div className={styles.tileV}>
          {moodImageCount > 0 ? (
            <>
              {moodImageCount}
              <em>images</em>
            </>
          ) : (
            "Start"
          )}
        </div>
        <div className={styles.tileD}>
          {moodImageCount === 0 ? "Pin your visual brief" : "Curator-extracted palettes"}
        </div>
      </Link>

      {/* GUESTS — paywalled */}
      {isPaidTier ? (
        <button
          type="button"
          className={`${styles.tile} ${styles.tileGuests}`}
          onClick={() => showToast("Guests sheet ships when paid tier lights up.")}
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
          <div className={styles.tileL}>Guests</div>
          <div className={styles.tileV}>
            {guestRsvpIn ?? 0}
            {guestTotal != null && <em>/ {guestTotal}</em>}
          </div>
          <div className={styles.tileD}>
            {guestTotal && guestRsvpIn != null
              ? `${Math.round((guestRsvpIn / guestTotal) * 100)}% RSVP'd`
              : "Send save-the-date"}
          </div>
        </button>
      ) : (
        <button
          type="button"
          className={`${styles.tile} ${styles.tileGuests} ${styles.tileLocked}`}
          onClick={() =>
            showToast("Guest features unlock at <em>$19.99/mo</em>. Upgrade flow lands in Phase 4.")
          }
        >
          <div className={styles.tileH}>
            <div className={styles.tileIco}>
              <svg viewBox="0 0 24 24">
                <circle cx="9" cy="8" r="3" />
                <circle cx="17" cy="9" r="2" />
                <path d="M3 19a6 6 0 0112 0M14 19a4 4 0 017-2.5" />
              </svg>
            </div>
            <span className={styles.tileLockedBadge}>Premium</span>
          </div>
          <div className={styles.tileL}>Guests</div>
          <div className={styles.tileV}>
            {guestTotal != null ? (
              <>
                {guestTotal}
                <em>invites</em>
              </>
            ) : (
              "Manage list"
            )}
          </div>
          <div className={styles.tileLockCta}>Upgrade — $19.99/mo →</div>
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
        <div className={styles.tileL}>Plnr</div>
        <div className={styles.tileV}>{hasPlnr ? "Booked" : "Find one"}</div>
        <div className={styles.tileD}>
          {hasPlnr ? "Day-of details" : "Browse DFW Plnrs"}
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
        <div className={styles.tileL}>Venu</div>
        <div className={styles.tileV}>{hasVenu ? "Locked" : "Pick one"}</div>
        <div className={styles.tileD}>
          {hasVenu ? "Walkthroughs & contract" : "Browse DFW venues"}
        </div>
      </button>
    </section>
  );
}
