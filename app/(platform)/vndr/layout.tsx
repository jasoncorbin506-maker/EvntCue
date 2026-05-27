import type { CSSProperties, ReactNode } from "react";
import { Suspense } from "react";
import { BottomNav } from "./_components/BottomNav";
import s from "./vndr.module.css";

/**
 * Vndr portal layout (V-2a — chrome + bottom-nav shell shipped 2026-05-23).
 *
 * Mobile-first phone frame on desktop preview, edge-to-edge on mobile. The
 * BottomNav is persistent across all five tabs (Home / Inquiries / Bookings
 * / Profile / Money).
 *
 * Sets the per-portal accent (--prime) to coral per Lock 18's portal-color
 * map. Cross-portal components (Cue panel, milestone tiles, etc.) reference
 * var(--prime) so they paint in coral when rendered inside this portal.
 *
 * Note: this layout is a SIBLING of orgnz — not nested under it. That's
 * deliberate. The orgnz layout mounts Chrome with backdrop-filter: blur,
 * which creates a containing-block trap for fixed-position modals on mobile
 * (Lock 22 mood-board EventDateEditor bug). By keeping Vndr at the platform
 * root we sidestep that inheritance entirely.
 *
 * Auth/role check happens upstream in proxy.ts — this layout assumes the
 * request has already been gated to a user with role='vndr' or 'admin'.
 */
const vndrTheme: CSSProperties = {
  ["--prime" as string]: "var(--coral)",
  ["--prime-light" as string]: "var(--cl)",
  ["--prime-bold" as string]: "var(--cb)",
  ["--prime-tint" as string]: "var(--ct)",
};

export default function VndrLayout({ children }: { children: ReactNode }) {
  return (
    <div id="vndr-app" style={vndrTheme} className={s.phone}>
      <div className={s.scroll}>{children}</div>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
