import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import { LangToggle } from "@/app/_components/LangToggle";
import { SignOutButton } from "@/app/_components/SignOutButton";
import styles from "./login.module.css";

export async function generateMetadata() {
  const t = await getTranslations("login");
  return {
    title: t("metaTitle"),
    description: t("signinSub"),
  };
}

type SearchParams = {
  mode?: "signin" | "signup";
  intent?: string;
  role?: string;
  next?: string;
};

// Same-origin path guard for `next` — must start with "/" and not "//"
// (which would resolve to a foreign origin). Prevents open-redirect.
function safeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  return next;
}

export default async function LoginPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;
  const intent = sp.intent ?? null;
  const role = sp.role ?? null;
  const next = safeNext(sp.next);
  // Default to signup when arriving from the ghost-event CTA — these users
  // are converting for the first time. Returning users override with ?mode=signin.
  const mode: "signin" | "signup" =
    sp.mode === "signin" ? "signin" : sp.mode === "signup" ? "signup" : intent ? "signup" : "signin";

  // If they're already signed in, route straight to the portal. We don't
  // run postAuthSeed here because Server Components can't write cookies
  // (only Server Actions and Route Handlers can). Seeding only happens at
  // the auth transition itself: signUp/signIn actions + /auth/callback.
  //
  // Role-aware routing: respect ?role=vndr only if the user actually has the
  // vndr role; otherwise pick the best default among the roles they DO have.
  // Without these guards, an authed user gets bounced into a portal they
  // can't access, proxy.ts redirects back to /login, and we loop.
  //
  // Users with no recognized role fall through to render the form, so they
  // can sign in as a different user or get unstuck.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Captured for the footer "Signed in as X · Sign out" escape. We only
  // render the form when a user has fallen through (no matching role) OR
  // is genuinely unauthed; in both cases letting them sign out is helpful.
  let stuckSessionEmail: string | null = null;
  if (user) {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleSet = new Set((roleRows ?? []).map((r) => r.role as string));

    if (role === "vndr" && roleSet.has("vndr")) {
      redirect(next ?? "/vndr-onboarding/1");
    }
    if (role === "venue" && roleSet.has("venue")) {
      redirect(next ?? "/venu");
    }
    if (role === "plnr" && roleSet.has("plnr")) {
      redirect(next ?? "/plnr");
    }
    if (role === "catr" && roleSet.has("catr")) {
      redirect(next ?? "/catr");
    }
    if (roleSet.has("orgnz") || roleSet.has("admin")) {
      redirect(next ?? (intent === "mood_board" ? "/mood-board" : "/orgnz"));
    }
    // Fallback to vndr-onboarding ONLY when the requested role is vndr
    // (or unspecified). Without the role guard, an authed vndr-only user
    // visiting /login?role=orgnz (e.g., from the event-preview "Build Mood
    // Board" CTA) gets bounced into vndr-onboarding instead of the form —
    // they can't sign out + create an organizer account from the routed
    // destination. With the guard, they fall through to the "stuck session"
    // form below with a sign-out escape.
    if (roleSet.has("vndr") && (role === "vndr" || role === null)) {
      redirect(next ?? "/vndr-onboarding/1");
    }
    // Same guard for venue/plnr/catr single-role users — route to their
    // portal when no other-portal role was specifically requested.
    if (roleSet.has("venue") && (role === "venue" || role === null)) {
      redirect(next ?? "/venu");
    }
    if (roleSet.has("plnr") && (role === "plnr" || role === null)) {
      redirect(next ?? "/plnr");
    }
    if (roleSet.has("catr") && (role === "catr" || role === null)) {
      redirect(next ?? "/catr");
    }
    // No matching role for the requested portal — fall through to render
    // the form, AND expose a sign-out link in the footer so the user can
    // escape the stale session.
    stuckSessionEmail = user.email ?? "this account";
  }

  const t = await getTranslations("login");
  // Role-flavored signup copy when arriving from a portal funnel (?role=…).
  // Without this, the signup card shows organizer voice ("Keep your event
  // live") to vendors (V-1b funnel) or venues (/venues modal funnel). Sign-in
  // copy is generic across roles; only signup branches.
  const signupHeadlineKey =
    role === "vndr"
      ? "signupHeadlineVndr"
      : role === "venue"
        ? "signupHeadlineVenu"
        : "signupHeadline";
  const signupSubKey =
    role === "vndr"
      ? "signupSubVndr"
      : role === "venue"
        ? "signupSubVenu"
        : "signupSub";
  const headline = mode === "signup" ? t(signupHeadlineKey) : t("signinHeadline");
  const sub = mode === "signup" ? t(signupSubKey) : t("signinSub");

  const otherMode = mode === "signup" ? "signin" : "signup";
  const otherLabel = mode === "signup" ? t("signIn") : t("createAccount");
  const swapPrompt = mode === "signup" ? t("swapToSignin") : t("swapToSignup");

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.langCorner}>
          <LangToggle />
        </div>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {/* Per-portal vertices, clockwise from top: Orgnz · Plnr · Vndr · Catr · Venu */}
              <circle cx="11" cy="3"  r="1.6" fill="var(--rose)" />
              <circle cx="19" cy="9"  r="1.6" fill="var(--violet)" />
              <circle cx="16" cy="18" r="1.6" fill="var(--coral)" />
              <circle cx="6"  cy="18" r="1.6" fill="var(--amber)" />
              <circle cx="3"  cy="9"  r="1.6" fill="var(--blue)" />
            </svg>
          </span>
          <span className={styles.brandWord}>EvntCue</span>
        </Link>

        <div className={styles.card}>
          <h1 className={styles.headline}>{headline}</h1>
          <p className={styles.sub}>{sub}</p>

          {/*
            key={mode} forces a remount when the swap link flips between
            signup ↔ signin. Without it, useActionState in LoginForm retains
            the prior submit's state — so after a signup hits "needsConfirm"
            and the user clicks "Sign in" to back out, the confirm screen
            keeps rendering even though mode === "signin".
          */}
          <LoginForm key={mode} mode={mode} intent={intent} role={role} next={next} />

          <p className={styles.swap}>
            {swapPrompt}{" "}
            <Link
              href={`/login?mode=${otherMode}${intent ? `&intent=${intent}` : ""}${role ? `&role=${role}` : ""}${next ? `&next=${encodeURIComponent(next)}` : ""}`}
              className={styles.swapLink}
            >
              {otherLabel}
            </Link>
          </p>
        </div>

        {/* Stale-session escape. Only renders when the request has an
            authed user that doesn't match any portal — proxy.ts + the
            block above would have redirected an authed user with a
            usable role. Without this, a fallthrough user has no way to
            sign out from /login except by clearing cookies manually. */}
        {stuckSessionEmail ? (
          <p className={styles.foot}>
            Signed in as {stuckSessionEmail} ·{" "}
            <SignOutButton variant="link" label="Sign out" />
          </p>
        ) : null}

        <p className={styles.foot}>
          {t("footTerms")}{" "}
          <Link href="/" className={styles.footLink}>
            {t("footBack")}
          </Link>
        </p>
      </div>
    </main>
  );
}
