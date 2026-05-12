"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import styles from "./landing.module.css";
import { captureComingSoon } from "./_actions/capture-coming-soon";

export type ComingSoonRole = "vndr" | "venu";

const ICONS: Record<ComingSoonRole, React.ReactNode> = {
  vndr: (
    <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
      <line x1="22" y1="6"  x2="22" y2="22" stroke="#E8622A" strokeWidth="1.2" strokeOpacity="0.6" />
      <line x1="22" y1="22" x2="10" y2="38" stroke="#E8622A" strokeWidth="1" strokeOpacity="0.55" />
      <line x1="22" y1="22" x2="22" y2="38" stroke="#E8622A" strokeWidth="1" strokeOpacity="0.55" />
      <line x1="22" y1="22" x2="34" y2="38" stroke="#E8622A" strokeWidth="1" strokeOpacity="0.55" />
      <circle cx="22" cy="6" r="3.8" fill="none" stroke="#E8622A" strokeWidth="0.8" opacity="0.4" />
      <circle cx="22" cy="6" r="2.4" fill="#E8622A" />
      <circle cx="22" cy="6" r="1.2" fill="#F5A882" />
    </svg>
  ),
  venu: (
    <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
      <line x1="10" y1="38" x2="10" y2="18" stroke="#2A6BDB" strokeWidth="1" strokeOpacity="0.55" />
      <line x1="34" y1="38" x2="34" y2="18" stroke="#2A6BDB" strokeWidth="1" strokeOpacity="0.55" />
      <polyline points="10,18 12,13 16,9 22,7 28,9 32,13 34,18" fill="none" stroke="#2A6BDB" strokeWidth="1" strokeOpacity="0.55" />
      <circle cx="22" cy="7" r="3.8" fill="none" stroke="#2A6BDB" strokeWidth="0.8" opacity="0.4" />
      <circle cx="22" cy="7" r="2.4" fill="#2A6BDB" />
      <circle cx="22" cy="7" r="1.2" fill="#7EB3F5" />
    </svg>
  ),
};

const CTA_CLASS: Record<ComingSoonRole, string> = {
  vndr: styles.modalCtaVndr,
  venu: styles.modalCtaVenu,
};

export function ComingSoonModal({ role, onClose }: { role: ComingSoonRole; onClose: () => void }) {
  const t = useTranslations("comingSoon");
  const titleKey = role === "vndr" ? "vndrTitle" : "venuTitle";
  const subKey = role === "vndr" ? "vndrSub" : "venuSub";
  const bodyEmKey = role === "vndr" ? "vndrBodyEm" : "venuBodyEm";
  const bodyKey = role === "vndr" ? "vndrBody" : "venuBody";

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await captureComingSoon(role, email);
      if (result.ok) {
        setSuccess(true);
        setTimeout(onClose, 1800);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div
      className={styles.modalBg}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("ariaLabel", { title: t(titleKey) })}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label={t("close")}>×</button>
        <div className={styles.modalIcon}>{ICONS[role]}</div>
        <div className={styles.modalTitle}>{t(titleKey)}</div>
        <div className={styles.modalSub}>{t(subKey)}</div>
        <div className={styles.modalBody}>
          <em>{t(bodyEmKey)}</em>
          {t(bodyKey)}
        </div>

        {success ? (
          <div className={styles.modalSuccess}>{t("success")}</div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="email"
              className={styles.modalInput}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              disabled={pending}
              autoComplete="email"
            />
            {error && <div className={styles.modalError}>{error}</div>}
            <button
              type="button"
              className={`${styles.modalCta} ${CTA_CLASS[role]}`}
              onClick={submit}
              disabled={pending}
            >
              {pending ? t("ctaSending") : t("cta")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
