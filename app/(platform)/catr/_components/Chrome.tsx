import Link from "next/link";
import { SignOutButton } from "@/app/_components/SignOutButton";
import s from "../catr.module.css";

/**
 * Top chrome for the Catr portal. Caterer mark + name + role label on the
 * left, optional right slot. Mirrors the venu/vndr Chrome pattern — the mark
 * is decorative (NOT a tap target); a back arrow only renders on detail routes
 * via `backHref`.
 */
export type ChromeProps = {
  catererName: string;
  roleLabel: string;
  right?: React.ReactNode;
  backHref?: string;
};

export function Chrome({ catererName, roleLabel, right, backHref }: ChromeProps) {
  return (
    <header className={s.chrome}>
      <div className={s.chromeL}>
        {backHref ? (
          <Link href={backHref} className={s.chromeBack} aria-label="Back">
            ‹
          </Link>
        ) : (
          <div className={s.chromeMark} aria-hidden="true" />
        )}
        <div className={s.chromeName} style={backHref ? { marginLeft: 8 } : undefined}>
          <div className={s.chromeCaterer}>{catererName}</div>
          <div className={s.chromeRole}>{roleLabel}</div>
        </div>
      </div>
      {right && <div className={s.chromeR}>{right}</div>}
    </header>
  );
}

/** Sign-out icon button for the chrome right slot — matches the round back glyph. */
export function ChromeSignOut() {
  return <SignOutButton variant="icon" className={s.chromeBack} ariaLabel="Sign out" />;
}
