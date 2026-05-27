"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import s from "../vndr.module.css";

import {
  acceptDateChange,
  declineDateChange,
  undoEventNotificationResponse,
} from "../_actions/respond-to-event-notification";

import { NOTIFICATION_EXPIRY_DAYS } from "@/lib/events/event-notifications-shared";
import type { VndrDateChangeNotification } from "@/lib/vndr/event-notifications";

/**
 * Full detail surface for a date-change notification (Lock 24 Chunk C).
 *
 * Two-CTA decision page per Lock 24 UX walkthrough:
 *   - "Accept new date" (coral filled, primary visual weight)
 *   - "Decline this change" (coral outline — declining is a legitimate
 *     business choice, not an error; not red, not destructive-looking)
 *
 * Reason section hidden when null (UX critique #1.5).
 * Impact callout uses bay-blue background (informational, not warning) —
 * no payout-timing line in V1 since Phase 4 payment flows aren't wired
 * (Cowork can add when Phase 4 lands).
 *
 * Post-action state surfaces an 8-second undo toast per Lock 22 forgiveness
 * pattern. Decline gets the toast but with explicit "decline is recoverable
 * via direct communication, not via undo" framing — the toast still allows
 * an undo within the 8s window for pure accidents.
 *
 * Tertiary "Message [Orgnz]" link is OUT of this chunk per Chunk B
 * brief / lock entry deferral: messaging surface keyed to event_notifications
 * doesn't exist (lib/messaging is keyed to booking_inquiries). Future
 * chunk if observed behavior demands.
 */

type Props = {
  notification: VndrDateChangeNotification;
};

function formatDate(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  // HH:MM:SS → "4:00 PM"
  const [h, m] = iso.split(":").map((p) => parseInt(p, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(isoA + "T00:00:00").getTime();
  const b = new Date(isoB + "T00:00:00").getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function expiryDate(createdAt: string): string {
  const created = new Date(createdAt);
  created.setDate(created.getDate() + NOTIFICATION_EXPIRY_DAYS);
  return created.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type PostAction = null | { kind: "accepted" } | { kind: "declined" };

export function DateChangeDetail({ notification }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [postAction, setPostAction] = useState<PostAction>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Auto-dismiss toast after 8s per Lock 22.
  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastVisible(false), 8000);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  const oldDateLong = formatDate(notification.payload.oldStartDate);
  const newDateLong = formatDate(notification.payload.newStartDate);
  const oldTime = formatTime(notification.payload.oldStartTime);
  const newTime = formatTime(notification.payload.newStartTime);
  const shiftDays = daysBetween(
    notification.payload.oldStartDate,
    notification.payload.newStartDate,
  );

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptDateChange(notification.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPostAction({ kind: "accepted" });
      setToastVisible(true);
    });
  }

  function handleDecline() {
    setError(null);
    startTransition(async () => {
      const result = await declineDateChange(notification.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPostAction({ kind: "declined" });
      setToastVisible(true);
    });
  }

  function handleUndo() {
    if (!postAction) return;
    const prior = postAction.kind; // "accepted" | "declined"
    setError(null);
    startTransition(async () => {
      const result = await undoEventNotificationResponse(notification.id, prior);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPostAction(null);
      setToastVisible(false);
    });
  }

  // Post-action layout: show confirmation message + undo toast.
  if (postAction) {
    return (
      <div className={s.dcDetail}>
        <Link href="/vndr/inquiries" className={s.dcBack}>
          ← Back to Inquiries
        </Link>
        <div className={s.dcPostState}>
          {postAction.kind === "accepted" ? (
            <>
              <div className={s.dcPostCheck} aria-hidden="true">✓</div>
              <div className={s.dcPostTitle}>Date change accepted.</div>
              <div className={s.dcPostSub}>The Orgnz has been notified.</div>
            </>
          ) : (
            <>
              <div className={s.dcPostCheck} aria-hidden="true">✓</div>
              <div className={s.dcPostTitle}>Decline sent.</div>
              <div className={s.dcPostSub}>
                The Orgnz will be notified. If you change your mind, they can
                re-send the request — message them directly if you&apos;d like
                to reconsider.
              </div>
            </>
          )}
        </div>
        {toastVisible && (
          <div className={s.dcUndoToast} role="status" aria-live="polite">
            <span className={s.dcUndoToastMessage}>
              {postAction.kind === "accepted" ? "Accepted." : "Declined."}
            </span>
            <button
              type="button"
              className={s.dcUndoToastButton}
              onClick={handleUndo}
              disabled={pending}
            >
              Undo
            </button>
          </div>
        )}
      </div>
    );
  }

  // Pre-decision layout: full decision surface.
  const reason = notification.payload.reason;

  return (
    <div className={s.dcDetail}>
      <Link href="/vndr/inquiries" className={s.dcBack}>
        ← Back to Inquiries
      </Link>

      <div className={s.dcHero}>
        <div className={s.dcEyebrow}>Change details</div>
        <h1 className={s.dcEventName}>{notification.eventName}</h1>
        <div className={s.dcEventMeta}>
          {notification.eventType.replace(/_/g, " ")}
        </div>
      </div>

      <div className={s.dcChangeCard}>
        <div className={s.dcChangeRow}>
          <span className={s.dcChangeLbl}>was</span>
          <div className={s.dcChangeValue}>
            <div>{oldDateLong}</div>
            {oldTime && <div className={s.dcChangeTime}>{oldTime}</div>}
          </div>
        </div>
        <div className={s.dcChangeArrow} aria-hidden="true">↓</div>
        <div className={s.dcChangeRow}>
          <span className={s.dcChangeLbl}>now</span>
          <div className={`${s.dcChangeValue} ${s.dcChangeValueNew}`}>
            <div>{newDateLong}</div>
            {newTime && <div className={s.dcChangeTime}>{newTime}</div>}
          </div>
        </div>
      </div>

      {reason && (
        <div className={s.dcReason}>
          <div className={s.dcReasonLbl}>Reason from the Orgnz</div>
          <div className={s.dcReasonText}>&ldquo;{reason}&rdquo;</div>
        </div>
      )}

      <div className={s.dcImpact}>
        This change moves your booking by{" "}
        <b>
          {Math.abs(shiftDays)} day{Math.abs(shiftDays) === 1 ? "" : "s"}
        </b>
        {shiftDays >= 0 ? " later" : " earlier"}. Your calendar lock on{" "}
        {formatDate(notification.payload.oldStartDate)} will release if you
        decline.
      </div>

      {error && <div className={s.dcError}>{error}</div>}

      <div className={s.dcCtas}>
        <button
          type="button"
          className={s.dcAccept}
          onClick={handleAccept}
          disabled={pending}
        >
          {pending ? "Saving…" : "Accept new date"}
        </button>
        <button
          type="button"
          className={s.dcDecline}
          onClick={handleDecline}
          disabled={pending}
        >
          {pending ? "Saving…" : "Decline this change"}
        </button>
      </div>

      <div className={s.dcExpiry}>
        If you don&apos;t respond by <b>{expiryDate(notification.createdAt)}</b>,
        the Orgnz will see you didn&apos;t respond and can proceed with finding
        a replacement. Your calendar lock on{" "}
        {formatDate(notification.payload.oldStartDate)} will release automatically.
      </div>
    </div>
  );
}
