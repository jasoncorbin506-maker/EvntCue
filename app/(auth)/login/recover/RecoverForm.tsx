"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { requestRecoveryAction, type RecoverResult } from "./_actions/recover";
import styles from "../login.module.css";

const initial: RecoverResult | null = null;

export function RecoverForm() {
  const t = useTranslations("recover");
  const [state, formAction, pending] = useActionState<RecoverResult | null, FormData>(
    async (_prev, formData) => requestRecoveryAction(formData),
    initial,
  );

  const error = state && state.ok === false ? state.error : null;
  const sent = state && state.ok === true;

  if (sent) {
    return (
      <div className={styles.confirm}>
        <div className={styles.confirmIcon} aria-hidden>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="var(--rb)" strokeWidth="1" />
            <path
              d="M10 14.5l8 5.5 8-5.5M10 14.5h16v9H10z"
              stroke="var(--rt)"
              strokeWidth="1.4"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <h2 className={styles.confirmTitle}>
          <em>{t("sentTitleEm")}</em>
        </h2>
        <p className={styles.confirmBody}>{t("sentBody")}</p>
        <p className={styles.confirmHint}>{t("sentHint")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      <label className={styles.field}>
        <span className={styles.label}>{t("emailLabel")}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={styles.input}
          placeholder={t("emailPlaceholder")}
        />
      </label>

      {error ? (
        <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
          {error}
        </div>
      ) : null}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "…" : t("sendLink")}
      </button>
    </form>
  );
}
