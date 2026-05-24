"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "../vndr.module.css";

/**
 * Sticky 5-tab bottom navigation for the Vndr portal. Active state derived
 * from pathname — first segment match against the tab's href, so deep routes
 * like /vndr/bookings/[event_id] keep Bookings highlighted.
 *
 * The desktop mockup (P1_Dashboard.html) sidebar exposes 11 destinations
 * across three groups (Business / Profile / Money). For mobile we consolidate:
 *
 *   Home      ← Dashboard (P1 surface)
 *   Inquiries ← Inquiries (high-frequency action — earns its own tab)
 *   Bookings  ← Bookings (high-frequency action — earns its own tab)
 *   Profile   ← Packages + Portfolio + Availability + COI & Docs (Business profile cluster)
 *   Money     ← Earnings + Analytics + Billing (financial cluster)
 *
 * Messages from the desktop sidebar surfaces inside Inquiries (since vendor↔
 * organizer messaging is always scoped to an inquiry/booking thread).
 *
 * Badge counts on Inquiries/Bookings are hardcoded illustrative state for
 * V-2a (matches the "2"/"4" the desktop mockup shows). V-2b wires to real
 * counts from inquiries / bookings tables filtered by current vendor.
 */
const TABS = [
  {
    href: "/vndr",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 12l9-8 9 8M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    href: "/vndr/inquiries",
    label: "Inquiries",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 7h16v12H4z" />
        <path d="M4 7l8 6 8-6" />
      </svg>
    ),
    badgeStub: 2,
  },
  {
    href: "/vndr/bookings",
    label: "Bookings",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M4 9h16M9 3v4M15 3v4" />
      </svg>
    ),
  },
  {
    href: "/vndr/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    href: "/vndr/money",
    label: "Money",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 4v16M7 8h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" />
      </svg>
    ),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className={s.nav} aria-label="Vndr portal tabs">
      {TABS.map((tab) => {
        // For Home (/vndr), require exact match — without this, every /vndr/*
        // route would also light up Home because they all startsWith("/vndr").
        const active =
          tab.href === "/vndr"
            ? pathname === "/vndr"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${s.navTab} ${active ? s.navTabActive : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <div className={s.navIco}>{tab.icon}</div>
            <div className={s.navLbl}>{tab.label}</div>
            {"badgeStub" in tab && tab.badgeStub > 0 ? (
              <div className={s.navBadge}>{tab.badgeStub}</div>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
