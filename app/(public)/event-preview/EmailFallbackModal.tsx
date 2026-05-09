"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import s from "./preview.module.css";
import { attachEmailToSession } from "./_actions/attach-email";

export function EmailFallbackModal({ onClose }: { onClose: () => void }) {
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
      const res = await attachEmailToSession(email);
      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 1800);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className={s.modalBg} onClick={onClose} role="dialog" aria-modal="true" aria-label="Email me this budget">
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={s.modalClose} onClick={onClose} aria-label="Close">×</button>
        <div className={s.modalEyebrow}>Save for later</div>
        <div className={s.modalTitle}>Email me this budget</div>
        <div className={s.modalBody}>
          <em>We&rsquo;ll send you a copy</em> of your event budget summary so you can come back to it
          when you&rsquo;re ready. No commitment.
        </div>

        {success ? (
          <div className={s.modalSuccess}>Sent. Check your inbox.</div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="email"
              className={s.modalInput}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              disabled={pending}
              autoComplete="email"
            />
            {error && <div className={s.modalError}>{error}</div>}
            <button type="button" className={s.modalCta} onClick={submit} disabled={pending}>
              {pending ? "Sending…" : "Email it to me"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
