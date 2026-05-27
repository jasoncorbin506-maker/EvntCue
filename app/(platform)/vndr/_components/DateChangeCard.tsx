"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import s from "../vndr.module.css";

import { acceptDateChange } from "../_actions/respond-to-event-notification";
import { NOTIFICATION_REMINDER_DAYS } from "@/lib/events/event-notifications-shared";
import type { VndrDateChangeNotification } from "@/lib/vndr/event-notifications";

/**
 * Date-change notification card variant for the Inquiries tab list.
 *
 * Per Lock 24 UX walkthrough:
 *   - Coral left border (4px full-height) signals "needs response"
 *   - Cormorant italic title ("Date change — [Event Name]") reads as
 *     a different category from new-inquiry cards
 *   - Mini date diff ("was X · now Y") with coral on the new date
 *   - Day-7 reminder badge state when the cron has stamped reminder_sent_at
 *   - Quick-action Accept button (UX critique #4.1 — bypass detail page
 *     for routine cases)
 *   - "Review change" link → opens the detail page for the full decision
 *     surface (Lock 22 + mobile ergonomics: full page, not modal)
 */

type Props = {
  notification: VndrDateChangeNotification;
};

function formatDateShort(iso: string | null): string {
  if (!iso) return "TBD";
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function daysSince(iso: string): number {
  const created = new Date(iso).getTime();
  return Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
}

export function DateChangeCard({ notification }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const oldShort = formatDateShort(notification.payload.oldStartDate);
  const newShort = formatDateShort(notification.payload.newStartDate);
  const showReminderBadge =
    notification.reminderSentAt !== null ||
    daysSince(notification.createdAt) >= NOTIFICATION_REMINDER_DAYS;

  function handleQuickAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptDateChange(notification.id);
      if (!result.ok) setError(result.error);
      // On success, revalidatePath in the server action causes the parent
      // page to re-render without this notification — the card disappears.
    });
  }

  return (
    <div className={s.dcCard}>
      <div className={s.dcCardBorder} aria-hidden="true" />
      <div className={s.dcCardBody}>
        <div className={s.dcCardTitle}>
          Date change <span className={s.dcCardDash}>—</span>{" "}
          <span className={s.dcCardEventName}>{notification.eventName}</span>
        </div>
        <div className={s.dcCardSub}>
          The Orgnz moved the {notification.eventType.replace(/_/g, " ")}.
        </div>
        <div className={s.dcCardDiff}>
          <span className={s.dcCardWas}>was {oldShort}</span>
          <span className={s.dcCardSep}>·</span>
          <span className={s.dcCardNow}>now {newShort}</span>
        </div>
        {showReminderBadge && (
          <div className={s.dcCardReminder}>
            Reminder sent — please respond
          </div>
        )}
        {error && <div className={s.dcCardError}>{error}</div>}
        <div className={s.dcCardActions}>
          <Link
            href={`/vndr/inquiries/date-change/${notification.id}`}
            className={s.dcCardReview}
          >
            Review change →
          </Link>
          <button
            type="button"
            className={s.dcCardAccept}
            onClick={handleQuickAccept}
            disabled={pending}
          >
            {pending ? "Accepting…" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
