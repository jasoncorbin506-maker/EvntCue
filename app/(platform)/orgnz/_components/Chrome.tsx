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
import type { OrgnzEventSummary } from "../_lib/load-context";

type Props = {
  eventName: string | null;
  startDateShort: string | null;
  daysOut: number | null;
  unreadInquiriesCount: number;
  // PL #61 — multi-event picker.
  events: OrgnzEventSummary[];
  selectedEventId: string | null;
  eventNotFound: boolean;
};

export function Chrome({
  eventName,
  startDateShort,
  daysOut,
  unreadInquiriesCount,
  events,
  selectedEventId,
  eventNotFound,
}: Props) {
  const t = useTranslations("dashboard");
  const tLang = useTranslations("lang");
  const locale = useLocale() as Locale;
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen && !pickerOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (pickerRef.current && !pickerRef.current.contains(target)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, pickerOpen]);

  // PL #61 — a stale/foreign `?event=` resolved to nothing. Inform softly and
  // strip the bad param (Lock 22: warnings inform, never block). Fire once.
  const notFoundShown = useRef(false);
  useEffect(() => {
    if (eventNotFound && !notFoundShown.current) {
      notFoundShown.current = true;
      showToast(t("pickerEventNotFound"));
      router.replace("/orgnz");
    }
  }, [eventNotFound, router, t]);

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

  function selectEvent(id: string) {
    setPickerOpen(false);
    if (id === selectedEventId) return;
    startTransition(() => {
      router.push(`/orgnz?event=${id}`);
    });
  }

  function statusPill(status: string | null) {
    if (!status) return null;
    const label =
      status === "draft"
        ? t("pickerStatusDraft")
        : status === "active"
          ? t("pickerStatusActive")
          : status.charAt(0).toUpperCase() + status.slice(1);
    const variant =
      status === "draft"
        ? styles.pickerPillDraft
        : status === "active"
          ? styles.pickerPillActive
          : "";
    return <span className={`${styles.pickerPill} ${variant}`}>{label}</span>;
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
      <div ref={pickerRef} className={styles.eventChipWrap}>
        <button
          type="button"
          className={styles.eventChipBtn}
          aria-haspopup="menu"
          aria-expanded={pickerOpen}
          aria-label={t("pickerAria")}
          onClick={() => setPickerOpen((v) => !v)}
        >
          <span className={styles.eventChip}>
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
          </span>
          <svg className={styles.eventChipCaret} viewBox="0 0 10 6" aria-hidden="true">
            <path d="M1 1l4 4 4-4" />
          </svg>
        </button>
        {pickerOpen && (
          <div className={styles.pickerPopover} role="menu">
            {events.length > 0 ? (
              events.map((ev) => {
                const isCurrent = ev.id === selectedEventId;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isCurrent}
                    className={`${styles.pickerItem} ${isCurrent ? styles.pickerItemCurrent : ""}`}
                    onClick={() => selectEvent(ev.id)}
                  >
                    <span className={styles.pickerItemMain}>
                      <span className={styles.pickerItemName}>{ev.name}</span>
                      <span className={styles.pickerItemMeta}>
                        {ev.dateLabel ? `${ev.dateLabel} · ${ev.typeLabel}` : ev.typeLabel}
                      </span>
                    </span>
                    {statusPill(ev.status)}
                    {isCurrent && (
                      <svg className={styles.pickerCheck} viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3 8.5l3.5 3.5L13 4.5" />
                      </svg>
                    )}
                  </button>
                );
              })
            ) : (
              <p className={styles.pickerEmpty}>{t("pickerEmpty")}</p>
            )}
            <div className={styles.pickerDivider} />
            <Link
              href="/budget-calculator"
              className={styles.pickerNewEvent}
              role="menuitem"
              onClick={() => setPickerOpen(false)}
            >
              <span className={styles.pickerNewEventPlus} aria-hidden="true">
                +
              </span>
              {t("pickerNewEvent")}
            </Link>
          </div>
        )}
      </div>
      <Link
        href="/orgnz/inquiries"
        className={styles.inqBtn}
        aria-label={`Inquiries${unreadInquiriesCount > 0 ? ` (${unreadInquiriesCount} unread)` : ""}`}
      >
        <svg viewBox="0 0 24 24">
          <path d="M4 7h16v12H4z" />
          <path d="M4 7l8 6 8-6" />
        </svg>
        {unreadInquiriesCount > 0 && (
          <span className={styles.inqBtnBadge}>{unreadInquiriesCount}</span>
        )}
      </Link>
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
