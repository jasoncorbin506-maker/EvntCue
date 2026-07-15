"use client";

import { useState, useTransition } from "react";
import { enterAccessCode } from "./_actions/enter-code";
import s from "./gate.module.css";

export function GateForm({ next }: { next: string | null }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // On success the action redirects and never returns.
      const result = await enterAccessCode({ code, next });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <form className={s.form} onSubmit={submit}>
      <label className={s.label} htmlFor="gate-code">
        Access code
      </label>
      <input
        id="gate-code"
        className={s.input}
        type="password"
        autoComplete="off"
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      {error ? <p className={s.err}>{error}</p> : null}
      <button className={s.submit} type="submit" disabled={pending || !code}>
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
