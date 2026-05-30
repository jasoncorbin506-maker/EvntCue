import type { CSSProperties, ReactNode } from "react";
import s from "./catr.module.css";

/**
 * Catr portal layout — phone frame + amber accent. Auth/role gating happens
 * upstream in proxy.ts (role='catr' or 'admin'); this layout assumes the
 * request is already gated. Sets the per-portal accent (--prime → amber) per
 * the locked portal-color map so any cross-portal component rendered here
 * paints amber.
 *
 * No bottom nav yet: the catr portal scaffolds the inquiry vertical only
 * (Lock 77 — Catr is an "expanded Vndr" at the inquiry layer; its full feature
 * stack is a deferred port). Navigation is via the home tiles + chrome back.
 */
const catrTheme: CSSProperties = {
  ["--prime" as string]: "var(--amber)",
  ["--prime-light" as string]: "var(--al)",
  ["--prime-bold" as string]: "var(--ab)",
  ["--prime-tint" as string]: "var(--at)",
  ["--prime-pale" as string]: "var(--att)",
};

export default function CatrLayout({ children }: { children: ReactNode }) {
  return (
    <div id="catr-app" style={catrTheme} className={s.phone}>
      <div className={s.scroll}>{children}</div>
    </div>
  );
}
