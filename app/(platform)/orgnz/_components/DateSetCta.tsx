"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { activateEventAction } from "../_actions/activate-event";
import s from "./DateSetCta.module.css";

/**
 * Lock 27 — "Date Set, Ready to Book" activation affordance.
 *
 * Surfaces on the Orgnz dashboard only while the event is a draft (the parent
 * gates rendering on event.status). Confirming flips draft → active via
 * activateEventAction; the event becomes transactional (bookings / inquiries /
 * payments unlock once those flows ship). Lock 22 posture: this is an
 * invitation, never a warning — "Not yet" dismisses it for the session.
 *
 * Distinct from LockDateCta (which flips date_status tentative → confirmed —
 * locking the date as final). Activation = "make the event real"; date-lock =
 * "this date won't move." The dashboard shows activation first; the date-lock
 * CTA appears once the event is active.
 */
export function DateSetCta({ eventId }: { eventId: string }) {
  const router = useRouter();
  const t = useTranslations("events.timing.activation");
  const [pending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (dismissed) return null;

  const handleActivate = () => {
    setError(null);
    startTransition(async () => {
      const result = await activateEventAction(eventId);
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      // Refresh — status is now 'active', so the parent stops rendering this.
      router.refresh();
    });
  };

  return (
    <div className={s.card}>
      <div className={s.eye}>{t("eyebrow")}</div>
      <h3 className={s.h}>
        {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
      </h3>
      <p className={s.p}>{t("body")}</p>
      <div className={s.row}>
        <button
          type="button"
          className={s.btn}
          onClick={handleActivate}
          disabled={pending}
        >
          {pending ? t("activating") : t("primary")}
        </button>
        <button
          type="button"
          className={s.ghost}
          onClick={() => setDismissed(true)}
          disabled={pending}
        >
          {t("secondary")}
        </button>
      </div>
      {error && <div className={s.error}>{error}</div>}
    </div>
  );
}
