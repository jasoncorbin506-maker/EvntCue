import Link from "next/link";
import s from "../venu.module.css";

/**
 * Top chrome for the Venu portal. Renders the venue mark + name + role label
 * (e.g., "Discover", "Tools") on the left and an optional right slot for
 * pills (live state, etc.).
 *
 * Two variants:
 * - Default: venue mark on the left, no back button. Used by all tab roots.
 * - Back-variant: pass `backHref` to swap the mark for a back arrow. Used
 *   by event-detail (Screen 2 in the mockup) and any drill-down route.
 *
 * Source mockup: 02_Locked_Prototypes/Venu/evntcue_venu_v1_mobile.html
 * lines ~386–407 (Screen 1 chrome) + ~565–574 (Screen 2 back-chrome).
 * Per Lock 14b operational-competence register — venue/event name in
 * Cormorant italic, role in Barlow Condensed.
 */
export type ChromeProps = {
  venueName: string;
  roleLabel: string;
  right?: React.ReactNode;
  /** If set, renders a back-arrow button (← target href) in place of the venue mark. */
  backHref?: string;
};

export function Chrome({ venueName, roleLabel, right, backHref }: ChromeProps) {
  return (
    <header className={s.chrome}>
      <div className={s.chromeL}>
        {backHref ? (
          <Link href={backHref} className={s.chromeBack} aria-label="Back">
            ‹
          </Link>
        ) : (
          <Link href="/venu/discover" className={s.chromeMark} aria-label="EvntCue Venu home" />
        )}
        <div className={s.chromeName} style={backHref ? { marginLeft: 8 } : undefined}>
          <div className={s.chromeVenue}>{venueName}</div>
          <div className={s.chromeRole}>{roleLabel}</div>
        </div>
      </div>
      {right && <div className={s.chromeR}>{right}</div>}
    </header>
  );
}

/**
 * "Live" pill — bay-blue, glowing dot. Reuse on Discover + Tools chrome when
 * the venue has a live event today (placeholder logic — wired in chunk B).
 */
export function LivePill() {
  return <span className={`${s.pill} ${s.pillLive}`}>Live</span>;
}
