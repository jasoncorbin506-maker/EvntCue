"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "../venu.module.css";

/**
 * Sticky 5-tab bottom navigation for the Venu portal. Active state derived
 * from pathname — first segment match against the tab's href, so deep routes
 * like /venu/bookings/[event_id] keep the Bookings tab highlighted.
 *
 * Source mockup: 02_Locked_Prototypes/Venu/evntcue_venu_v1_mobile.html
 * lines ~529–551 (Screen 1 nav). Five tabs per Venu_Locked_2026-05-13.md
 * §"Nav structure (five tabs)".
 *
 * Inquiries badge wired via prop from the portal layout — real count of
 * status ∈ {inquiry, reviewing} per Venu_Locked_2026-05-13.md row 2.
 * 0 hides the badge entirely.
 */
const TABS = [
  {
    href: "/venu/discover",
    label: "Discover",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" />
      </svg>
    ),
  },
  {
    href: "/venu/inquiries",
    label: "Inquiries",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 7h16v12H4z" />
        <path d="M4 7l8 6 8-6" />
      </svg>
    ),
  },
  {
    href: "/venu/bookings",
    label: "Bookings",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M4 9h16M9 3v4M15 3v4" />
      </svg>
    ),
  },
  {
    href: "/venu/tools",
    label: "Tools",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M14.7 6.3a4.5 4.5 0 0 1 6.4 6.3l-9.6 9.6a2.5 2.5 0 0 1-3.5-3.5L17 9.7M3 13l4 4M9 7l3 3" />
      </svg>
    ),
  },
  {
    href: "/venu/money",
    label: "Money",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 4v16M7 8h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" />
      </svg>
    ),
  },
] as const;

type Props = {
  inquiryCount: number;
};

export function BottomNav({ inquiryCount }: Props) {
  const pathname = usePathname();
  return (
    <nav className={s.nav} aria-label="Venu portal tabs">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const badge = tab.href === "/venu/inquiries" ? inquiryCount : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${s.navTab} ${active ? s.navTabActive : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <div className={s.navIco}>{tab.icon}</div>
            <div className={s.navLbl}>{tab.label}</div>
            {badge > 0 && (
              <div className={s.navBadge}>{badge}</div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
