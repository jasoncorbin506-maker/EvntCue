import Link from "next/link";
import s from "./BackLink.module.css";

/**
 * Canonical drilldown back-link (PL #66) — chevron + label.
 *
 * Two call shapes, one look:
 *  - `href`    → renders a <Link> (navigation back to a route).
 *  - `onClick` → renders a <button> (an in-page "up one level" state action,
 *                e.g. clearing a selected category). Use within a client component.
 *
 * The `label` is supplied by the caller (route-/context-aware, i18n-bound where
 * the surrounding surface is wired for it). Pass `className` to add
 * context spacing (the shared styling owns the affordance; the caller owns
 * its placement).
 *
 * Scope (PL #66 two-tier): this is for full-screen / desktop drilldowns
 * (mood-board, orgnz/browse). The compact mobile portal Chrome
 * (venu/catr/vndr) intentionally keeps its own icon-only `‹` affordance.
 */
type BackLinkBase = {
  label: string;
  /** Defaults to `label` when omitted. */
  ariaLabel?: string;
  className?: string;
};

type BackLinkProps = BackLinkBase &
  (
    | { href: string; onClick?: never }
    | { href?: never; onClick: () => void }
  );

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function BackLink(props: BackLinkProps) {
  const { label, ariaLabel, className } = props;
  const cls = className ? `${s.backLink} ${className}` : s.backLink;

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={cls} aria-label={ariaLabel ?? label}>
        <Chevron />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={cls} aria-label={ariaLabel ?? label}>
      <Chevron />
      <span>{label}</span>
    </button>
  );
}
