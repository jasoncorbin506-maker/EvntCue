"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "../_actions/sign-out";
import styles from "../orgnz.module.css";

type Props = {
  eventName: string | null;
  eventMeta: string | null;
  daysOut: number | null;
  userInitials: string;
  userName: string;
  userRole: string;
};

type NavItem = {
  label: string;
  icon: string;
  href?: string; // present = real route; absent = inert placeholder
  badge?: string;
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Event",
    items: [
      { label: "Dashboard", icon: "◈", href: "/orgnz" },
      { label: "Mood Board", icon: "✦", href: "/orgnz/mood-board" },
      { label: "Timeline", icon: "◷" },
      { label: "Checklist", icon: "✓" },
    ],
  },
  {
    section: "Vendors",
    items: [
      { label: "Venue", icon: "◫" },
      { label: "Browse Vendors", icon: "◉" },
      { label: "My Bookings", icon: "▤" },
    ],
  },
  {
    section: "Finance",
    items: [
      { label: "Budget", icon: "◎" },
      { label: "Invoices", icon: "▦" },
    ],
  },
  {
    section: "People",
    items: [
      { label: "Guests", icon: "◍" },
      { label: "My Plnr", icon: "◇" },
      { label: "Messages", icon: "✉" },
    ],
  },
];

export function Sidebar(props: Props) {
  const pathname = usePathname();

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/orgnz") return pathname === "/orgnz";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sbHead}>
        <div className={styles.logoRow}>
          {/* 5-vertex constellation, per-portal palette per session-6 lock:
              apex rose (Cue voice), then violet (Plnr), coral (Vndr), amber
              (Catr), blue (Venu) clockwise. */}
          <svg viewBox="0 0 28 28" width="20" height="20" aria-hidden>
            <rect width="28" height="28" rx="5" fill="#0B1220" />
            <line x1="9" y1="4" x2="20" y2="8" stroke="#D4778A" strokeWidth="0.9" strokeOpacity="0.7" />
            <line x1="20" y1="8" x2="20" y2="20" stroke="#D4778A" strokeWidth="0.9" strokeOpacity="0.7" />
            <line x1="20" y1="20" x2="9" y2="24" stroke="#D4778A" strokeWidth="0.9" strokeOpacity="0.7" />
            <line x1="9" y1="24" x2="3.5" y2="14" stroke="#D4778A" strokeWidth="0.9" strokeOpacity="0.7" />
            <line x1="3.5" y1="14" x2="9" y2="4" stroke="#D4778A" strokeWidth="0.9" strokeOpacity="0.7" />
            {/* Minor vertices */}
            <circle cx="20" cy="8" r="1.4" fill="#AFA9EC" />
            <circle cx="20" cy="20" r="1.4" fill="#E8622A" />
            <circle cx="9" cy="24" r="1.4" fill="#C98A1A" />
            <circle cx="3.5" cy="14" r="1.4" fill="#2A6BDB" />
            {/* Apex (rose / Cue voice) */}
            <circle cx="9" cy="4" r="2.2" fill="#E8A0B0" />
            <circle cx="9" cy="4" r="1.1" fill="#F2C8D4" />
            <circle cx="9" cy="4" r="0.5" fill="#fff" />
          </svg>
          <div className={styles.wm}>
            <em>Evnt</em>
            <span>Cue</span>
          </div>
        </div>
        {eventChip(props)}
      </div>

      <nav className={styles.nav}>
        {NAV.map((group) => (
          <div key={group.section}>
            <div className={styles.navSec}>{group.section}</div>
            {group.items.map((item) => {
              const active = isActive(item.href);
              const className = `${styles.ni} ${active ? styles.niOn : ""} ${
                item.href ? "" : styles.niSoon
              }`.trim();
              const inner = (
                <>
                  <span className={styles.niIc}>{item.icon}</span>
                  {item.label}
                  {item.badge ? (
                    <span className={styles.niBadge}>{item.badge}</span>
                  ) : null}
                </>
              );
              return item.href ? (
                <Link key={item.label} href={item.href} className={className}>
                  {inner}
                </Link>
              ) : (
                <span key={item.label} className={className} aria-disabled>
                  {inner}
                </span>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.sbFoot}>
        <div className={styles.sbUser}>
          <div className={styles.av}>{props.userInitials}</div>
          <div className={styles.userMeta}>
            <div className={styles.userName}>{props.userName}</div>
            <div className={styles.userRole}>
              {props.userRole}
              <span className={styles.userRoleSep}> · </span>
              <form action={signOutAction} className={styles.signOutForm}>
                <button type="submit" className={styles.signOut}>
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function eventChip(props: Props) {
  if (!props.eventName) {
    return (
      <div className={styles.eventChip}>
        <p className={styles.ecName}>No event yet</p>
        <p className={styles.ecMeta}>Start with the calculator</p>
      </div>
    );
  }
  return (
    <div className={styles.eventChip}>
      <p className={styles.ecName}>{props.eventName}</p>
      <p className={styles.ecMeta}>{props.eventMeta}</p>
      {props.daysOut != null && props.daysOut >= 0 ? (
        <span className={styles.ecPill}>
          {props.daysOut === 0 ? "Today" : `${props.daysOut} days out`}
        </span>
      ) : null}
    </div>
  );
}
