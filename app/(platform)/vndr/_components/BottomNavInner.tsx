"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "../vndr.module.css";

/**
 * Sticky 5-tab bottom navigation for the Vndr portal. Active state derived
 * from pathname — first segment match against the tab's href, so deep routes
 * like /vndr/bookings/[event_id] keep Bookings highlighted.
 *
 * Inquiries unread badge is live (V-2c Session 1) — counted from the buyer
 * side of inquiry_messages for this vendor's inquiries. Bookings badge is
 * still a placeholder until a similar wire-up ships for bookings activity.
 */

type Props = {
  unreadCount: number;
};

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
    isInquiries: true,
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

export function BottomNavInner({ unreadCount }: Props) {
  const pathname = usePathname();
  return (
    <nav className={s.nav} aria-label="Vndr portal tabs">
      {TABS.map((tab) => {
        const active =
          tab.href === "/vndr"
            ? pathname === "/vndr"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const badge = "isInquiries" in tab && unreadCount > 0 ? unreadCount : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${s.navTab} ${active ? s.navTabActive : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <div className={s.navIco}>{tab.icon}</div>
            <div className={s.navLbl}>{tab.label}</div>
            {badge > 0 ? <div className={s.navBadge}>{badge}</div> : null}
          </Link>
        );
      })}
    </nav>
  );
}
