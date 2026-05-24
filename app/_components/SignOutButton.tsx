import { signOutAction } from "@/lib/auth/sign-out-action";

/**
 * Drop-in sign-out button. Wraps a single submit button in a form bound to
 * the shared signOutAction (lib/auth/sign-out-action.ts) which clears the
 * Supabase session cookie and redirects to "/".
 *
 * Surfaces using it (as of V-2a hotfix-2):
 *   - app/(platform)/orgnz/_components/Chrome.tsx (existing menu item)
 *   - app/(platform)/vndr/_components/Chrome.tsx (right-slot icon button)
 *   - app/(public)/vndr-onboarding/[step]/layout.tsx (small text link)
 *   - app/(auth)/login/page.tsx ("Not you? Sign out" footer link)
 *
 * Variants:
 *   - "icon": small 32×32 round button with a door-out glyph. For Chrome
 *     right slots where space is tight.
 *   - "link": inline text link. For sign-in/onboarding chrome where a
 *     button would feel heavy.
 *   - "menuItem": full-width danger-styled row, used inside dropdown
 *     menus. The Orgnz Chrome wires its own styled button so it doesn't
 *     use this variant; the component supports it for future menus.
 *
 * Always renders as a server-rendered form action — no client JS needed.
 * Pass a `className` to fold the host's own classes onto the button.
 */
export type SignOutButtonProps = {
  variant?: "icon" | "link" | "menuItem";
  label?: string;
  className?: string;
  ariaLabel?: string;
};

export function SignOutButton({
  variant = "link",
  label = "Sign out",
  className,
  ariaLabel,
}: SignOutButtonProps) {
  return (
    <form action={signOutAction} style={{ display: "inline" }}>
      <button
        type="submit"
        className={className}
        aria-label={ariaLabel ?? label}
        style={
          variant === "icon"
            ? undefined // host supplies its own styles via className
            : variant === "link"
              ? linkStyle
              : menuItemStyle
        }
      >
        {variant === "icon" ? (
          // Door-out glyph: framed door + arrow pointing out
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        ) : (
          label
        )}
      </button>
    </form>
  );
}

const linkStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: "inherit",
  font: "inherit",
  textDecoration: "underline",
};

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 14px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  color: "inherit",
  font: "inherit",
};
