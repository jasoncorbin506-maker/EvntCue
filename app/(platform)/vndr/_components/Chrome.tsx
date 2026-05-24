import Link from "next/link";
import { SignOutButton } from "@/app/_components/SignOutButton";
import s from "../vndr.module.css";

/**
 * Top chrome for the Vndr portal. Renders the vendor mark + display name +
 * category metadata on the left, plus an optional right slot (Cue button,
 * notif bell, pills).
 *
 * Mirrors the Venu Chrome pattern (mark = decorative, NOT a tap target —
 * earlier port treated it as a back link and users tab-rooted got dumped
 * elsewhere). Back-arrow only renders on detail routes via `backHref`.
 *
 * Source mockup: 02_Locked_Prototypes/Vndr/EvntCue_Vndr_P1_Dashboard.html
 * lines ~52–60 (.topbar). Port intentionally drops the desktop mockup's
 * backdrop-filter: blur(12px) — that's the same containing-block trap that
 * bit the mood-board EventDateEditor modal on mobile (Lock 22 forgiveness
 * note). Solid bg is safer; we can revisit blur if a modal pattern needs it.
 */
export type ChromeProps = {
  vendorName: string;
  meta?: string; // e.g., "Audio Visual · Dallas, TX"
  right?: React.ReactNode;
  backHref?: string;
};

export function Chrome({ vendorName, meta, right, backHref }: ChromeProps) {
  return (
    <header className={s.chrome}>
      <div className={s.chromeL}>
        {backHref ? (
          <Link href={backHref} className={s.notifBtn} aria-label="Back" style={{ width: 26, height: 26, borderRadius: "50%" }}>
            ‹
          </Link>
        ) : (
          <div className={s.chromeMark} aria-hidden="true" />
        )}
        <div className={s.chromeName} style={backHref ? { marginLeft: 8 } : undefined}>
          <div className={s.chromeVendor}>{vendorName}</div>
          {meta ? <div className={s.chromeMeta}>{meta}</div> : null}
        </div>
      </div>
      {right ? <div className={s.chromeR}>{right}</div> : null}
    </header>
  );
}

/**
 * Ask Cue button — paints in the portal's coral accent. Lands on /cue (future).
 * For now it's a static anchor so the chrome composition reads correctly; no
 * route exists yet.
 */
export function AskCueButton() {
  return (
    <button type="button" className={s.cueBtn} aria-label="Ask Cue">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
      </svg>
      Cue
    </button>
  );
}

/**
 * Notification bell with unread dot. Wires to the Lock 24 event_notifications
 * table when V-2b lands; for now the dot is hardcoded illustrative state.
 */
export function NotifButton({ hasUnread = false }: { hasUnread?: boolean }) {
  return (
    <button type="button" className={s.notifBtn} aria-label="Notifications">
      <svg viewBox="0 0 24 24">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 0 0 4 0" />
      </svg>
      {hasUnread ? <span className={s.notifDot} aria-hidden="true" /> : null}
    </button>
  );
}

/**
 * Sign-out icon button styled to match Notif/Cue. Door-out glyph. Lifted
 * into the Vndr Chrome right slot as a hotfix because there was no escape
 * hatch from the portal otherwise (proxy.ts kept bouncing back to /vndr
 * once you were authed). When the orgnz-style "..." overflow menu lands
 * we can demote this into the menu; for now it stays visible.
 */
export function ChromeSignOut() {
  return <SignOutButton variant="icon" className={s.notifBtn} ariaLabel="Sign out" />;
}
