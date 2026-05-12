import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import { LangToggle } from "@/app/_components/LangToggle";
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

  const t = await getTranslations("login");
  const headline = mode === "signup" ? t("signupHeadline") : t("signinHeadline");
  const sub = mode === "signup" ? t("signupSub") : t("signinSub");

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
          <LoginForm key={mode} mode={mode} intent={intent} role={role} />

          <p className={styles.swap}>
            {swapPrompt}{" "}
            <Link
              href={`/login?mode=${otherMode}${intent ? `&intent=${intent}` : ""}${role ? `&role=${role}` : ""}`}
              className={styles.swapLink}
            >
              {otherLabel}
            </Link>
          </p>
        </div>

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
