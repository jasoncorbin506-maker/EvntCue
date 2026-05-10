import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export const metadata = {
  title: "Sign in · EvntCue",
  description: "Sign in or create an account to keep your event live in EvntCue.",
};

type SearchParams = {
  mode?: "signin" | "signup";
  intent?: string;
  role?: string;
};

export default async function LoginPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;
  const intent = sp.intent ?? null;
  const role = sp.role ?? null;
  // Default to signup when arriving from the ghost-event CTA — these users
  // are converting for the first time. Returning users override with ?mode=signin.
  const mode: "signin" | "signup" =
    sp.mode === "signin" ? "signin" : sp.mode === "signup" ? "signup" : intent ? "signup" : "signin";

  // If they're already signed in, route straight to the portal. We don't
  // run postAuthSeed here because Server Components can't write cookies
  // (only Server Actions and Route Handlers can). Seeding only happens at
  // the auth transition itself: signUp/signIn actions + /auth/callback.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(intent === "mood_board" ? "/orgnz/mood-board" : "/orgnz");
  }

  const headline =
    mode === "signup" ? "Keep your event live." : "Welcome back.";
  const sub =
    mode === "signup"
      ? "Your budget, milestones, and mood board are waiting. One step from here."
      : "Sign in to pick up where you left off.";

  const otherMode = mode === "signup" ? "signin" : "signup";
  const otherLabel = mode === "signup" ? "Sign in" : "Create account";

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
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

          <LoginForm mode={mode} intent={intent} role={role} />

          <p className={styles.swap}>
            {mode === "signup" ? "Already have an account?" : "New to EvntCue?"}{" "}
            <Link
              href={`/login?mode=${otherMode}${intent ? `&intent=${intent}` : ""}${role ? `&role=${role}` : ""}`}
              className={styles.swapLink}
            >
              {otherLabel}
            </Link>
          </p>
        </div>

        <p className={styles.foot}>
          By continuing you agree to EvntCue&rsquo;s terms.{" "}
          <Link href="/" className={styles.footLink}>
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
