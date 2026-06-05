"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type { InquiryEventOption } from "@/lib/orgnz/active-events";
import { invitePlanner } from "../_actions/invite-planner";
import { showToast } from "../_lib/toast";
import orgnzStyles from "../orgnz.module.css";
import s from "./SendInquirySheet.module.css";

/**
 * Buyer→planner invite composer (Lock 30 Phase C pt 2). Mirrors the SHAPE of
 * SendInquirySheet — pick one of your active events + an optional message — but
 * a planner is engaged via INVITE, not an inquiry (Lock 28 rejects plnr from the
 * inquiry path). Calls invitePlanner, which writes a revocable plnr_invites row.
 *
 * The message is optional here (an invite is a lighter touch than an inquiry),
 * and the CTA reads "Invite as planner" rather than "Send inquiry".
 */

export type InvitePlannerTarget = {
  tenantId: string;
  displayName: string;
};

type Props = {
  target: InvitePlannerTarget;
  events: InquiryEventOption[];
  /** Chrome's currently-selected event (PL #61) — defaults the picker. */
  defaultEventId?: string | null;
  onClose: () => void;
};

export function InvitePlannerSheet({ target, events, defaultEventId, onClose }: Props) {
  const [eventId, setEventId] = useState<string>(
    defaultEventId && events.some((e) => e.id === defaultEventId)
      ? defaultEventId
      : events[0]?.id ?? "",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasEvents = events.length > 0;
  const multipleEvents = events.length > 1;
  const selectedEvent = events.find((e) => e.id === eventId) ?? null;

  const eventContext = selectedEvent
    ? [
        selectedEvent.typeLabel,
        selectedEvent.subtype,
        selectedEvent.dateLabel,
        selectedEvent.guestCount != null
          ? `${selectedEvent.guestCount.toLocaleString("en-US")} guests`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  function onSend() {
    if (pending) return;
    setError(null);
    if (!eventId) {
      setError("Pick which event this invite is for.");
      return;
    }
    startTransition(async () => {
      const res = await invitePlanner({
        plnrTenantId: target.tenantId,
        eventId,
        message: message.trim(),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      showToast(`Invited <em>${target.displayName}</em> to plan with you.`);
      onClose();
    });
  }

  return createPortal(
    <>
      <div className={orgnzStyles.scrim} onClick={onClose} aria-hidden="true" />
      <aside
        className={`${orgnzStyles.drawer} ${orgnzStyles.drawerOpen}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-planner-title"
      >
        <div className={orgnzStyles.drawerHandle} />
        <div className={orgnzStyles.drawerHead}>
          <div>
            <div className={orgnzStyles.drawerEye}>Plnr</div>
            <h3 className={orgnzStyles.drawerTitle} id="invite-planner-title">
              Invite <em>{target.displayName}</em>
            </h3>
          </div>
          <button
            type="button"
            className={orgnzStyles.drawerClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={orgnzStyles.drawerBody}>
          {!hasEvents ? (
            <div className={s.noEvents}>
              <p className={s.noEventsBody}>
                Invites attach to an active event. You don&rsquo;t have one ready
                yet — set a date and activate an event, then invite a planner.
              </p>
              <Link href="/orgnz" className={s.noEventsCta} onClick={onClose}>
                Go to my events →
              </Link>
            </div>
          ) : (
            <>
              {multipleEvents && (
                <label className={s.field}>
                  <span className={s.fieldLabel}>For which event</span>
                  <select
                    className={s.select}
                    name="inviteEvent"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    disabled={pending}
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {selectedEvent && (
                <div className={s.eventCard}>
                  <div className={s.eventCardName}>{selectedEvent.name}</div>
                  {eventContext && (
                    <div className={s.eventCardMeta}>{eventContext}</div>
                  )}
                </div>
              )}

              <label className={s.field}>
                <span className={s.fieldLabel}>
                  Your message <span className={s.optional}>optional</span>
                </span>
                <textarea
                  className={s.textarea}
                  name="inviteMessage"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder={`Tell ${target.displayName} about your event and how you'd like to work together.`}
                  disabled={pending}
                />
              </label>

              {error && <div className={s.error}>{error}</div>}

              <button
                type="button"
                className={s.sendCta}
                onClick={onSend}
                disabled={pending}
              >
                {pending ? "Inviting…" : "Invite as planner"}
              </button>
            </>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}
