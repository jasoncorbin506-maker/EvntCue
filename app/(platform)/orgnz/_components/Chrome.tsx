"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import styles from "../orgnz.module.css";
import { signOutAction } from "@/lib/auth/sign-out-action";
import { showToast } from "../_lib/toast";
import { setLocaleAction } from "@/i18n/set-locale";
import type { Locale } from "@/i18n/locale";

type Props = {
  eventName: string | null;
  startDateShort: string | null;
  daysOut: number | null;
};

export function Chrome({ eventName, startDateShort, daysOut }: Props) {
  const t = useTranslations("dashboard");
  const tLang = useTranslations("lang");
  const locale = useLocale() as Locale;
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function flipLocale(next: Locale) {
    if (next === locale) {
      setMenuOpen(false);
      return;
    }
    setMenuOpen(false);
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  const daysCopy =
    daysOut == null
      ? null
      : daysOut === 0
        ? t("chromeDaysToday")
        : t("chromeDaysMany", { n: daysOut });

  return (
    <header className={styles.chrome}>
      <Link href="/orgnz" className={styles.wm}>
        <em>Evnt</em>
        <span>Cue</span>
      </Link>
      <div className={styles.eventChip}>
        {eventName ? (
          <span className={styles.eventChipName}>{eventName}</span>
        ) : (
          <span>{t("chromeEventDefault")}</span>
        )}
        {startDateShort && daysCopy && (
          <span className={styles.eventChipD}>
            {startDateShort} · {daysCopy}
          </span>
        )}
      </div>
      <div ref={menuRef} className={styles.menuWrap}>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label={t("menuAria")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 16 16">
            <circle cx="3" cy="8" r="1" />
            <circle cx="8" cy="8" r="1" />
            <circle cx="13" cy="8" r="1" />
          </svg>
        </button>
        {menuOpen && (
          <div className={styles.menuPopover} role="menu">
            <div className={styles.menuLangRow} aria-label={tLang("ariaLabel")}>
              <span className={styles.menuLangLabel}>{t("menuLanguage")}</span>
              <div className={styles.menuLangPills}>
                <button
                  type="button"
                  className={`${styles.menuLangPill} ${locale === "en" ? styles.menuLangPillOn : ""}`}
                  aria-pressed={locale === "en"}
                  onClick={() => flipLocale("en")}
                >
                  {tLang("en")}
                </button>
                <button
                  type="button"
                  className={`${styles.menuLangPill} ${locale === "es" ? styles.menuLangPillOn : ""}`}
                  aria-pressed={locale === "es"}
                  onClick={() => flipLocale("es")}
                >
                  {tLang("es")}
                </button>
              </div>
            </div>
            <div className={styles.menuDivider} />
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                showToast(t("menuSettingsToast"));
              }}
            >
              {t("menuSettings")}
            </button>
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                showToast(t("menuSwitchEventToast"));
              }}
            >
              {t("menuSwitchEvent")}
            </button>
            <form action={signOutAction}>
              <button
                type="submit"
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                role="menuitem"
              >
                {t("menuSignOut")}
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
