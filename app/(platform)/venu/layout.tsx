import type { CSSProperties, ReactNode } from "react";
import { BottomNav } from "./_components/BottomNav";
import s from "./venu.module.css";

/**
 * Venu portal layout (chunk A — chrome + bottom-nav shell shipped 2026-05-17).
 *
 * Renders the phone frame on desktop, edge-to-edge on mobile. BottomNav is
 * persistent across all five tabs (Discover / Inquiries / Bookings / Tools
 * / Money) and the event-detail route under bookings/[event_id] — the lock
 * doc keeps the nav visible everywhere except auth gates.
 *
 * Sets the per-portal accent (--prime) to bay-blue per Lock 9 portal-color
 * map. Cross-portal components reference var(--prime) so they paint in the
 * portal they're rendered into.
 *
 * Auth/role check happens upstream in proxy.ts — this layout assumes the
 * request has already been gated to a user with role='venue' or 'admin'.
 */
const venuTheme: CSSProperties = {
  ["--prime" as string]: "var(--blue)",
  ["--prime-light" as string]: "var(--blul)",
  ["--prime-bold" as string]: "var(--blub)",
  ["--prime-tint" as string]: "var(--blut)",
  ["--prime-pale" as string]: "var(--blutt)",
};

export default function VenuLayout({ children }: { children: ReactNode }) {
  return (
    <div id="venu-app" style={venuTheme} className={s.phone}>
      <div className={s.scroll}>{children}</div>
      <BottomNav />
    </div>
  );
}
