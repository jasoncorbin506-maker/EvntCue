import type { CSSProperties, ReactNode } from "react";

/**
 * Venu portal layout.
 *
 * Sets the per-portal accent (`--prime`) to bay-blue per Lock 9 portal-color
 * map. Chrome, BottomNav, and other surface components land in session 15
 * (per the Venu_Locked_2026-05-13.md CC port handoff section).
 *
 * Auth/role check happens upstream in proxy.ts — this layout assumes the
 * request has already been gated to a user with role='venue' or 'admin'.
 */
const venuTheme: CSSProperties = {
  // Bay-blue maps to the existing --blue token family in tokens.css.
  // Per-portal --prime convention: components reference var(--prime) and
  // its tints so cross-portal components render in whichever portal's color
  // they're embedded in.
  ["--prime" as string]: "var(--blue)",
  ["--prime-light" as string]: "var(--blul)",
  ["--prime-bold" as string]: "var(--blub)",
  ["--prime-tint" as string]: "var(--blut)",
  ["--prime-pale" as string]: "var(--blutt)",
};

export default function VenuLayout({ children }: { children: ReactNode }) {
  return (
    <div id="venu-app" style={venuTheme}>
      {children}
    </div>
  );
}
