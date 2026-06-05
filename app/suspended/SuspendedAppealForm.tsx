"use client";

import { useState, useTransition } from "react";
import { submitAppeal } from "./_actions/submit-appeal";
import s from "./suspended.module.css";

/**
 * Appeal form on /suspended — the dignified off-ramp. No jargon, no dead-end.
 * On success, swaps to a confirmation so the user knows it landed.
 */
export function SuspendedAppealForm() {
  const [statement, setStatement] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className={s.confirm}>
        Your appeal is in. We’ll review it and follow up by email.
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitAppeal({
        statement,
        contactEmail: contactEmail.trim() || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className={s.form}>
      <label className={s.label} htmlFor="appeal-statement">
        Tell us what happened
      </label>
      <textarea
        id="appeal-statement"
        className={s.textarea}
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder="Share anything that helps us take another look."
        disabled={pending}
      />
      <label className={s.label} htmlFor="appeal-email">
        Best email to reach you (optional)
      </label>
      <input
        id="appeal-email"
        type="email"
        className={s.input}
        value={contactEmail}
        onChange={(e) => setContactEmail(e.target.value)}
        placeholder="you@email.com"
        disabled={pending}
      />
      {error && <div className={s.err}>{error}</div>}
      <button
        type="submit"
        className={s.submit}
        disabled={pending || statement.trim().length < 10}
      >
        {pending ? "Sending…" : "Submit appeal"}
      </button>
    </form>
  );
}
