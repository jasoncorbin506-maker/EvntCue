"use client";

import { useActionState } from "react";
import { submitClaim, type ClaimResult } from "./_actions/claim-venue";
import s from "../../venues.module.css";

const initial: ClaimResult | null = null;

type Props = {
  token: string;
  venueDisplayName: string;
  venueCity: string | null;
};

export function ClaimForm({ token, venueDisplayName, venueCity }: Props) {
  const [state, formAction, pending] = useActionState<ClaimResult | null, FormData>(
    async (_prev, formData) => submitClaim(formData),
    initial,
  );

  const error = state && state.ok === false ? state.error : null;

  return (
    <main className={s.phone}>
      <header className={s.formChrome}>
        <span className={`${s.formBack} ${s.formBackDisabled}`} aria-hidden="true">
          ‹
        </span>
        <div className={s.formProgress}>
          <div className={s.formProgressBar} style={{ width: "66%" }} />
        </div>
        <div className={s.formStep}>Claim your venue</div>
      </header>

      <div className={s.formBody}>
        <h1 className={s.formH}>
          Welcome, <i>{venueDisplayName}</i>
        </h1>
        <p className={s.formSub}>
          We&apos;ve pre-built your dashboard{venueCity ? ` for ${venueCity}` : ""}. Set a
          password to take ownership — you&apos;ll be inside in seconds.
        </p>

        <form action={formAction} noValidate>
          <input type="hidden" name="token" value={token} />

          <div className={s.formFields}>
            <label className={s.formField}>
              <div className={s.formFieldLbl}>Your email · this becomes your login</div>
              <input
                className={s.formFieldInput}
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="manager@thelanternhall.com"
              />
            </label>
            <label className={s.formField}>
              <div className={s.formFieldLbl}>Set a password · 8+ characters</div>
              <input
                className={s.formFieldInput}
                type="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
              />
            </label>
          </div>

          {error ? (
            <div
              className={s.formNote}
              role="alert"
              style={{
                marginTop: 14,
                background: "rgba(232, 98, 42, 0.08)",
                borderColor: "rgba(232, 98, 42, 0.28)",
              }}
            >
              <div className={s.formNoteIco} style={{ color: "#F08560" }}>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16v.01" />
                </svg>
              </div>
              <div className={s.formNoteTxt}>{error}</div>
            </div>
          ) : null}

          <button type="submit" className={s.formSubmit} disabled={pending}>
            {pending ? "…" : "Claim my dashboard"}
          </button>
        </form>

        <div className={s.formNote} style={{ marginTop: 14 }}>
          <div className={s.formNoteIco}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16v.01" />
            </svg>
          </div>
          <div className={s.formNoteTxt}>
            <b>Not the right venue?</b> Don&apos;t use this link — it&apos;s tied to one
            property. Email{" "}
            <a href="mailto:team@evntcue.com" style={{ color: "var(--blut)" }}>
              team@evntcue.com
            </a>
            .
          </div>
        </div>
      </div>
    </main>
  );
}
