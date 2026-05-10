"use client";

import { useActionState } from "react";
import { submitAuth, type AuthResult } from "./_actions/auth";
import styles from "./login.module.css";

type Props = {
  mode: "signin" | "signup";
  intent: string | null;
  role: string | null;
};

const initial: AuthResult | null = null;

export function LoginForm({ mode, intent, role }: Props) {
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(
    async (_prev, formData) => submitAuth(formData),
    initial,
  );

  const cta = mode === "signup" ? "Create account" : "Sign in";
  const error = state && state.ok === false ? state.error : null;
  const needsConfirm = state && state.ok === false && state.needsConfirm;

  if (needsConfirm) {
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
          <em>Check your email.</em>
        </h2>
        <p className={styles.confirmBody}>{error}</p>
        <p className={styles.confirmHint}>
          Open the link on this device so we can finish wiring your event into the
          workspace. The link expires in an hour.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="mode" value={mode} />
      {intent ? <input type="hidden" name="intent" value={intent} /> : null}
      {role ? <input type="hidden" name="role" value={role} /> : null}

      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={styles.input}
          placeholder="you@email.com"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Password</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
          className={styles.input}
          placeholder={mode === "signup" ? "8+ characters" : "Your password"}
        />
      </label>

      {error ? (
        <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
          {error}
        </div>
      ) : null}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "…" : cta}
      </button>
    </form>
  );
}
