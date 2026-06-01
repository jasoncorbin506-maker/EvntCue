"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { setEventVenueLocation } from "../_actions/set-event-venue-location";
import { showToast } from "../_lib/toast";
import orgnzStyles from "../orgnz.module.css";
import s from "./EventVenueAddressSheet.module.css";

/**
 * Manual venue address entry (Lock 30 — private / backyard case). Opened from
 * the Browse-Venu card's "Not for us" prompt: maybe the event is at someone's
 * home or a business address, not a marketplace venue. Captures a full address
 * (line2 = suite/room) + a business/home type that surfaces to sellers.
 */

type LocationType = "business" | "home";

type Props = {
  eventId: string;
  onClose: () => void;
  onSaved: () => void;
};

export function EventVenueAddressSheet({ eventId, onClose, onSaved }: Props) {
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [locationType, setLocationType] = useState<LocationType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  function onSave() {
    if (pending) return;
    setError(null);
    if (!locationType) {
      setError("Pick whether it's a business or a home.");
      return;
    }
    startTransition(async () => {
      const res = await setEventVenueLocation({
        eventId,
        line1,
        line2,
        city,
        state: stateVal,
        postalCode,
        locationType,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      showToast("<em>Venue location saved.</em>");
      onSaved();
    });
  }

  const inputProps = {
    autoComplete: "off" as const,
    "data-1p-ignore": true,
    "data-lpignore": "true",
    disabled: pending,
  };

  return createPortal(
    <>
      <div className={orgnzStyles.scrim} onClick={onClose} aria-hidden="true" />
      <aside
        className={`${orgnzStyles.drawer} ${orgnzStyles.drawerOpen}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-address-title"
      >
        <div className={orgnzStyles.drawerHandle} />
        <div className={orgnzStyles.drawerHead}>
          <div>
            <div className={orgnzStyles.drawerEye}>Your venue</div>
            <h3 className={orgnzStyles.drawerTitle} id="venue-address-title">
              <em>Where&rsquo;s your event?</em>
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
          <p className={s.intro}>
            Booking your own place — a home, a business, anywhere? Drop the
            address so your team knows exactly where to go.
          </p>

          <label className={s.field}>
            <span className={s.label}>Street address</span>
            <input className={s.input} value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="123 Oak Street" {...inputProps} />
          </label>

          <label className={s.field}>
            <span className={s.label}>Suite / room <span className={s.opt}>(optional)</span></span>
            <input className={s.input} value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Room 4B · Backyard · Suite 200" {...inputProps} />
          </label>

          <div className={s.row}>
            <label className={`${s.field} ${s.grow}`}>
              <span className={s.label}>City</span>
              <input className={s.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Dallas" {...inputProps} />
            </label>
            <label className={`${s.field} ${s.stateField}`}>
              <span className={s.label}>State</span>
              <input className={s.input} value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="TX" {...inputProps} />
            </label>
            <label className={`${s.field} ${s.zipField}`}>
              <span className={s.label}>ZIP</span>
              <input className={s.input} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="75201" inputMode="numeric" {...inputProps} />
            </label>
          </div>

          <div className={s.field}>
            <span className={s.label}>Is this a business or a home?</span>
            <div className={s.toggle}>
              {(["business", "home"] as LocationType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${s.toggleBtn} ${locationType === t ? s.toggleBtnOn : ""}`}
                  onClick={() => setLocationType(t)}
                  disabled={pending}
                  aria-pressed={locationType === t}
                >
                  {t === "business" ? "Business" : "Home"}
                </button>
              ))}
            </div>
            <span className={s.hint}>
              Some Vndrs don&rsquo;t service private homes — sharing this lets them opt out early.
            </span>
          </div>

          {error && <div className={s.error}>{error}</div>}

          <button type="button" className={s.saveCta} onClick={onSave} disabled={pending}>
            {pending ? "Saving…" : "Save venue location"}
          </button>
        </div>
      </aside>
    </>,
    document.body,
  );
}
