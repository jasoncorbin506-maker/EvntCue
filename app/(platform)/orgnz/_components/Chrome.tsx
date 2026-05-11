"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "../orgnz.module.css";
import { signOutAction } from "../_actions/sign-out";
import { showToast } from "../_lib/toast";

type Props = {
  eventName: string | null;
  startDateShort: string | null;
  daysOut: number | null;
};

export function Chrome({ eventName, startDateShort, daysOut }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className={styles.chrome}>
      <Link href="/orgnz" className={styles.wm}>
        <em>Evnt</em>
        <span>Cue</span>
      </Link>
      <div className={styles.eventChip}>
        {eventName ? (
          <span className={styles.eventChipName}>{eventName}</span>
        ) : (
          <span>Your celebration</span>
        )}
        {startDateShort && daysOut != null && (
          <span className={styles.eventChipD}>
            {startDateShort} · {daysOut === 0 ? "today" : `${daysOut} days`}
          </span>
        )}
      </div>
      <div ref={menuRef} className={styles.menuWrap}>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 16 16">
            <circle cx="3" cy="8" r="1" />
            <circle cx="8" cy="8" r="1" />
            <circle cx="13" cy="8" r="1" />
          </svg>
        </button>
        {menuOpen && (
          <div className={styles.menuPopover} role="menu">
            <div className={styles.menuLangRow} aria-label="Language">
              <span className={styles.menuLangLabel}>Language</span>
              <div className={styles.menuLangPills}>
                <button
                  type="button"
                  className={`${styles.menuLangPill} ${styles.menuLangPillOn}`}
                  aria-pressed="true"
                >
                  EN
                </button>
                <button
                  type="button"
                  className={styles.menuLangPill}
                  aria-pressed="false"
                  onClick={() => {
                    setMenuOpen(false);
                    showToast("Spanish lands in <em>Phase 3.3</em> · §46.");
                  }}
                >
                  ES
                </button>
              </div>
            </div>
            <div className={styles.menuDivider} />
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                showToast("Settings sheet lands in a future session.");
              }}
            >
              Settings
            </button>
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                showToast("Multi-event switching lands when bookings flow.");
              }}
            >
              Switch event
            </button>
            <form action={signOutAction}>
              <button
                type="submit"
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                role="menuitem"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
