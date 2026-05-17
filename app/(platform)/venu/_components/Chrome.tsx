import Link from "next/link";
import s from "../venu.module.css";

/**
 * Top chrome for the Venu portal. Renders the venue mark + name + role label
 * (e.g., "Discover", "Tools") on the left and an optional right slot for
 * pills (live state, etc.).
 *
 * Used by every tab inside (platform)/venu/. The event-detail variant (back
 * button + event title) renders a separate ChromeBack component in chunk B.
 *
 * Source mockup: 02_Locked_Prototypes/Venu/evntcue_venu_v1_mobile.html
 * lines ~386–407 (Screen 1 chrome). Per Lock 14b operational-competence
 * register — venue name in Cormorant italic, role in Barlow Condensed.
 */
export type ChromeProps = {
  venueName: string;
  roleLabel: string;
  right?: React.ReactNode;
};

export function Chrome({ venueName, roleLabel, right }: ChromeProps) {
  return (
    <header className={s.chrome}>
      <div className={s.chromeL}>
        <Link href="/venu/discover" className={s.chromeMark} aria-label="EvntCue Venu home" />
        <div className={s.chromeName}>
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
