"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { setPasswordAction, type SetPasswordResult } from "./_actions/set";
import styles from "../../login.module.css";

const initial: SetPasswordResult | null = null;

export function SetPasswordForm() {
  const t = useTranslations("recoverSet");
  const [state, formAction, pending] = useActionState<SetPasswordResult | null, FormData>(
    async (_prev, formData) => setPasswordAction(formData),
    initial,
  );

  const error = state && state.ok === false ? state.error : null;

  return (
    <form action={formAction} className={styles.form} noValidate>
      <label className={styles.field}>
        <span className={styles.label}>{t("passwordLabel")}</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={styles.input}
          placeholder={t("passwordPlaceholder")}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{t("confirmLabel")}</span>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={styles.input}
          placeholder={t("confirmPlaceholder")}
        />
      </label>

      {error ? (
        <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
          {error}
        </div>
      ) : null}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "…" : t("submit")}
      </button>
    </form>
  );
}
