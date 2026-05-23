"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateEventDateAction } from "../_actions/update-event-date";
import type { EventTimingFields } from "@/lib/events/timing";
import s from "./LockDateCta.module.css";

/**
 * "Lock your date" CTA — surfaces on the Orgnz dashboard when
 * date_status === 'tentative'. Click → flips to 'confirmed' (vendor
 * calendars block, confirmation goes to invitees).
 *
 * Per F5.b + Q1 in decisions-log/2026-05-23-event-start-time-architecture.md.
 *
 * Single-button affordance — no preview pane needed here because flipping
 * date_status alone doesn't move dates (cascade diff is empty). The full
 * edit flow with cascade lives in EventDateEditor.
 */

export type LockDateCtaProps = {
  eventId: string;
  currentTiming: EventTimingFields;
  /** Optional callback after successful lock — caller can refresh data. */
  onLocked?: () => void;
};

export function LockDateCta({
  eventId,
  currentTiming,
  onLocked,
}: LockDateCtaProps) {
  const router = useRouter();
  const t = useTranslations("events.timing.lock");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Only surface when status is tentative. Hooks above to comply with rules.
  if (currentTiming.date_status !== "tentative") return null;

  const handleLock = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateEventDateAction({
        mode: "commit",
        eventId,
        newStartDate: currentTiming.start_date,
        newStartTime: currentTiming.start_time,
        newDateStatus: "confirmed",
        reason: "User locked tentative date",
      });
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      // Refresh to re-render with date_status='confirmed' (CTA self-hides)
      onLocked?.();
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
      <button
        type="button"
        className={s.btn}
        onClick={handleLock}
        disabled={pending}
      >
        {pending ? t("locking") : t("button")}
      </button>
      {error && <div className={s.error}>{error}</div>}
    </div>
  );
}
