import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./SetPasswordForm";
import { LangToggle } from "@/app/_components/LangToggle";
import styles from "../../login.module.css";

export async function generateMetadata() {
  const t = await getTranslations("recoverSet");
  return {
    title: t("metaTitle"),
    description: t("sub"),
  };
}

export default async function RecoverSetPage() {
  // Auth-gated. /auth/recover lands the user here with a fresh recovery
  // session; if there's no session the link expired or was tampered with.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login/recover?error=expired_link");
  }

  const t = await getTranslations("recoverSet");

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.langCorner}>
          <LangToggle />
        </div>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="3" r="1.6" fill="var(--rose)" />
              <circle cx="19" cy="9" r="1.6" fill="var(--violet)" />
              <circle cx="16" cy="18" r="1.6" fill="var(--coral)" />
              <circle cx="6" cy="18" r="1.6" fill="var(--amber)" />
              <circle cx="3" cy="9" r="1.6" fill="var(--blue)" />
            </svg>
          </span>
          <span className={styles.brandWord}>EvntCue</span>
        </Link>

        <div className={styles.card}>
          <h1 className={styles.headline}>{t("headline")}</h1>
          <p className={styles.sub}>{t("sub")}</p>

          <SetPasswordForm />
        </div>
      </div>
    </main>
  );
}
