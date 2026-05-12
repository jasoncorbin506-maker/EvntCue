"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/i18n/set-locale";
import type { Locale } from "@/i18n/locale";
import styles from "./LangToggle.module.css";

export function LangToggle({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("lang");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function pick(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div
      className={`${styles.toggle} ${className ?? ""}`}
      role="group"
      aria-label={t("ariaLabel")}
    >
      <button
        type="button"
        className={`${styles.pill} ${locale === "en" ? styles.on : ""}`}
        aria-pressed={locale === "en"}
        onClick={() => pick("en")}
        disabled={pending}
      >
        {t("en")}
      </button>
      <button
        type="button"
        className={`${styles.pill} ${locale === "es" ? styles.on : ""}`}
        aria-pressed={locale === "es"}
        onClick={() => pick("es")}
        disabled={pending}
      >
        {t("es")}
      </button>
    </div>
  );
}
