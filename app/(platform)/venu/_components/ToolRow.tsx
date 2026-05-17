import Link from "next/link";
import type { ReactNode } from "react";
import s from "../venu.module.css";

/**
 * Single tool row on the Tools tab. Each row is a tappable card with an icon,
 * name, sub-line, optional status badge (e.g., "Saturday" for Venu Live), and
 * a right chevron.
 *
 * Source mockup: Screen 1 lines ~415–490 (Tools tab tool-row pattern).
 *
 * PARKING_LOT #45 open design items — three of the five rows below have stub
 * exits (per-space detail, Venu Live cockpit interior, commission-flows
 * config sheet are all undesigned). For chunk C those rows route to a
 * placeholder "[name] · interior coming next" page. Real exits land when
 * Jason resolves the design items.
 */
export type ToolBadge = {
  label: string;
  /** Tone for the badge — drives the color treatment. */
  tone: "live" | "alert" | "neutral";
};

export type ToolRowProps = {
  href: string;
  icon: ReactNode;
  name: string;
  sub: string;
  badge?: ToolBadge;
};

export function ToolRow({ href, icon, name, sub, badge }: ToolRowProps) {
  const badgeCls = badge
    ? badge.tone === "live"
      ? s.toolRowBadgeLive
      : badge.tone === "alert"
        ? s.toolRowBadgeAlert
        : s.toolRowBadgeNeutral
    : "";

  return (
    <Link href={href} className={s.toolRow}>
      <div className={s.toolRowIco}>{icon}</div>
      <div className={s.toolRowBody}>
        <div className={s.toolRowName}>{name}</div>
        <div className={s.toolRowSub}>{sub}</div>
      </div>
      <div className={s.toolRowMeta}>
        {badge && <div className={`${s.toolRowBadge} ${badgeCls}`}>{badge.label}</div>}
        <div className={s.toolRowArrow}>›</div>
      </div>
    </Link>
  );
}
