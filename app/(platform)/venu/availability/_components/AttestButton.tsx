"use client";

import { useState, useTransition } from "react";
import { attestNoExistingReservations } from "../../_actions/attest-no-existing-reservations";
import s from "./AttestButton.module.css";

/**
 * "Confirm — I have no existing reservations elsewhere." Sets the
 * onboarding-gate attestation row. Idempotent (server action upserts).
 */
export function AttestButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await attestNoExistingReservations();
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <>
      <button
        type="button"
        className={s.button}
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? "Confirming…" : "I have no existing reservations"}
      </button>
      {error && <div className={s.error}>{error}</div>}
    </>
  );
}
