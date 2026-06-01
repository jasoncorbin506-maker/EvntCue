"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
// (no mounted-gate effect — this sheet only mounts after a client click, so it
// never renders during SSR; a typeof-document guard covers the portal target.)
import { createPortal } from "react-dom";
import type { InquiryEventOption } from "@/lib/orgnz/active-events";
import { createInquiry } from "../_actions/create-inquiry";
import { showToast } from "../_lib/toast";
import orgnzStyles from "../orgnz.module.css";
import s from "./SendInquirySheet.module.css";

/**
 * Buyer-initiated inquiry composer (Phase 4 R4a).
 *
 * The first UI that calls `createInquiry` — before this, inquiries existed only
 * via the seeder. Opens from a marketplace listing card; the buyer picks one of
 * their ACTIVE events (Lock 27 gates inquiries to active events), writes a
 * message, and sends. On success the seller gets the branded inquiry-received
 * email and the row lands in both portals' inquiry lists.
 *
 * Generic over seller type via `target.portal` so vndr/catr cards can reuse it
 * verbatim; R4a wires it to venue cards only.
 */

export type InquiryTarget = {
  tenantId: string;
  displayName: string;
  portal: "vndr" | "venu" | "catr";
};

const PORTAL_NOUN: Record<InquiryTarget["portal"], string> = {
  vndr: "Vndr",
  venu: "Venu",
  catr: "Catr",
};

/** Map create-inquiry failure codes to buyer-facing copy (Lock 22 toast tone). */
function errorMessage(code: string, noun: string): string {
  switch (code) {
    case "event_not_activated":
      return "That event is still a draft. Set its date and mark it ready to book first.";
    case "event_not_found":
      return "We couldn't find that event. Refresh and try again.";
    case "missing_message":
      return "Add a short message before sending.";
    case "invalid_seller":
      return `This ${noun} can't receive inquiries right now.`;
    case "auth":
      return "Your session expired — sign in again.";
    default:
      return "Something went wrong sending your inquiry. Please try again.";
  }
}

type Props = {
  target: InquiryTarget;
  events: InquiryEventOption[];
  onClose: () => void;
};

export function SendInquirySheet({ target, events, onClose }: Props) {
  const [eventId, setEventId] = useState<string>(events[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const noun = PORTAL_NOUN[target.portal];
  const hasEvents = events.length > 0;

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
    if (!message.trim()) {
      setError(errorMessage("missing_message", noun));
      return;
    }
    if (!eventId) {
      setError("Pick which event this inquiry is for.");
      return;
    }
    const parsedGuests = guestCount.trim() ? Number(guestCount) : null;
    startTransition(async () => {
      const res = await createInquiry({
        vndrTenantId: target.tenantId,
        eventId,
        message: message.trim(),
        guestCount:
          parsedGuests != null && Number.isFinite(parsedGuests) && parsedGuests > 0
            ? Math.round(parsedGuests)
            : null,
      });
      if (!res.ok) {
        setError(errorMessage(res.error, noun));
        return;
      }
      showToast(`Inquiry sent to <em>${target.displayName}</em>.`);
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
        aria-labelledby="send-inquiry-title"
      >
        <div className={orgnzStyles.drawerHandle} />
        <div className={orgnzStyles.drawerHead}>
          <div>
            <div className={orgnzStyles.drawerEye}>{noun}</div>
            <h3 className={orgnzStyles.drawerTitle} id="send-inquiry-title">
              Inquire with <em>{target.displayName}</em>
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
                Inquiries attach to an active event. You don&rsquo;t have one ready
                to book yet — set a date and activate an event, then reach out.
              </p>
              <Link href="/orgnz" className={s.noEventsCta} onClick={onClose}>
                Go to my events →
              </Link>
            </div>
          ) : (
            <>
              <label className={s.field}>
                <span className={s.fieldLabel}>For which event</span>
                <select
                  className={s.select}
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  disabled={pending}
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                      {ev.dateLabel ? ` · ${ev.dateLabel}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className={s.field}>
                <span className={s.fieldLabel}>Your message</span>
                <textarea
                  className={s.textarea}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder={`Tell ${target.displayName} about your event and what you're looking for.`}
                  disabled={pending}
                />
              </label>

              <label className={s.field}>
                <span className={s.fieldLabel}>
                  Approx. guest count <span className={s.optional}>(optional)</span>
                </span>
                <input
                  className={s.input}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="e.g. 120"
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
                {pending ? "Sending…" : "Send inquiry"}
              </button>
            </>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}
