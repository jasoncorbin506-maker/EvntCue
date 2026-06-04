import type { CSSProperties, ReactNode } from "react";
import s from "./plnr.module.css";

/**
 * Plnr portal layout — phone frame + violet accent. Auth/role gating happens
 * upstream in proxy.ts (role='plnr' or 'admin'); this layout assumes the
 * request is already gated. Sets the per-portal accent (--prime → violet) per
 * the locked portal-color map so any cross-portal component rendered here
 * paints violet.
 *
 * Mirrors app/(platform)/catr/layout.tsx. The violet family in tokens.css only
 * carries --violet / --vl / --vt, so --prime-bold / --prime-pale derive an
 * inline rgba of #AFA9EC rather than a (non-existent) --vb / --vtt token.
 *
 * No bottom nav: the plnr portal scaffolds the invite + profile verticals only
 * (Lock 30 Phase C pt 2). Navigation is via the home tiles + chrome back.
 */
const plnrTheme: CSSProperties = {
  ["--prime" as string]: "var(--violet)",
  ["--prime-light" as string]: "var(--vl)",
  ["--prime-bold" as string]: "rgba(175, 169, 236, 0.28)",
  ["--prime-tint" as string]: "var(--vt)",
  ["--prime-pale" as string]: "rgba(175, 169, 236, 0.6)",
};

export default function PlnrLayout({ children }: { children: ReactNode }) {
  return (
    <div id="plnr-app" style={plnrTheme} className={s.phone}>
      <div className={s.scroll}>{children}</div>
    </div>
  );
}
