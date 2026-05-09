"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import s from "./budget.module.css";
import { requestMegaScoping } from "./_actions/request-mega-scoping";
import type { CategoryKey, DateHorizon } from "@/data/budget-presets";

export function MegaEventModal({
  category,
  subtypeKey,
  dateHorizon,
  onClose,
}: {
  category: CategoryKey;
  subtypeKey: string | null;
  dateHorizon: DateHorizon;
  onClose: () => void;
}) {
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
      const res = await requestMegaScoping({
        category,
        subtypeKey: subtypeKey ?? undefined,
        dateHorizon,
        email,
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 1800);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className={s.modalBg} onClick={onClose} role="dialog" aria-modal="true" aria-label="Mega-event scoping">
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={s.modalClose} onClick={onClose} aria-label="Close">×</button>
        <div className={s.modalEyebrow}>500+ guests</div>
        <div className={s.modalTitle}>Our team scopes this directly.</div>
        <div className={s.modalBody}>
          <em>Events at this scale need real conversations</em> — venue holds, catering tiers, security,
          and AV rigging that don&rsquo;t fit a generic template. Drop your email and we&rsquo;ll reach out
          within one business day to scope your event one-on-one.
        </div>

        {success ? (
          <div className={s.modalSuccess}>
            We&rsquo;ll be in touch within one business day.
          </div>
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
            <button
              type="button"
              className={s.modalCta}
              onClick={submit}
              disabled={pending}
            >
              {pending ? "Sending…" : "Connect me with your team"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
