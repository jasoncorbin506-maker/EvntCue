"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import s from "./venues.module.css";
import { startVenueSignup } from "./_actions/start-venue-signup";

/**
 * Door B entry — the "Get started" CTA on /venues opens this capture modal.
 *
 * One overlay does the whole signup: venue identity (name, contact, city) +
 * email + password → account created → /venu. Delegates email/password auth to
 * the shared signUpAction via startVenueSignup, so no auth logic is duplicated.
 * Replaced the standalone /venues/start page 2026-05-28 per Jason.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StartVenueCta() {
  const t = useTranslations("venuStart");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [venueName, setVenueName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) firstFieldRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const canSubmit =
    venueName.trim().length >= 2 &&
    contactName.trim().length >= 2 &&
    EMAIL_RE.test(email.trim()) &&
    city.trim().length >= 2 &&
    password.length >= 8;

  function submit() {
    if (pending || !canSubmit) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("venueName", venueName);
      fd.set("contactName", contactName);
      fd.set("email", email);
      fd.set("city", city);
      fd.set("password", password);
      const res = await startVenueSignup(fd);
      if (res.ok) {
        router.push(res.redirectTo);
        return;
      }
      // needsConfirm (email confirmation on) or a validation/auth error — both
      // arrive as a message string from the shared action.
      setError(res.error);
    });
  }

  return (
    <>
      <button type="button" className={s.heroCta} onClick={() => setOpen(true)}>
        {t("openCta")}
      </button>

      {open ? (
        <div
          className={s.modalBg}
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
          onClick={() => setOpen(false)}
        >
          <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
            <svg className={s.modalPaisley} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Boteh motif — Wikimedia Commons "Simple paisley.svg", CC0 (public domain). */}
                <pattern
                  id="venuePaisley"
                  patternUnits="userSpaceOnUse"
                  width="70"
                  height="86"
                  patternTransform="rotate(6)"
                >
                  <g
                    fill="currentColor"
                    transform="translate(9 10) scale(0.6724) translate(-65.616689 -101.07083)"
                  >
                    <path d="m 108.05114,101.44661 c -15.874998,1.79917 -30.338888,12.065 -37.464999,26.56417 -8.995834,18.27389 -5.57389,39.86389 8.607778,54.53945 8.219723,8.46666 18.309168,13.29972 30.409451,14.49916 8.29027,0.81139 14.11111,-0.45861 20.35527,-4.48027 4.62139,-2.96334 9.38389,-8.60778 11.07723,-13.12334 1.65805,-4.37444 1.94028,-6.10306 1.905,-11.04194 -0.0353,-4.33917 -0.10584,-5.04473 -1.09361,-8.04334 -1.51695,-4.55083 -3.56306,-7.83167 -7.12612,-11.39472 -3.28083,-3.24556 -6.70277,-5.53861 -10.4775,-6.87917 -2.78694,-1.02305 -7.62,-1.905 -10.37166,-1.905 -2.36361,0 -6.73806,-1.05833 -8.89,-2.15194 -3.13973,-1.5875 -6.314727,-4.65667 -8.219727,-7.90223 -1.128889,-1.86972 -2.293055,-6.45583 -2.293055,-8.81944 0,-2.61056 1.234722,-7.09083 2.54,-9.24278 0.635,-1.02305 2.010833,-2.71639 3.069162,-3.77472 3.45723,-3.38667 6.20889,-4.69195 12.48834,-5.85611 1.34055,-0.28223 2.01083,-0.56445 2.01083,-0.91723 0,-0.56444 -1.97555,-0.59972 -6.52639,-0.0705 z m -3.52778,2.25778 c -9.842496,5.04472 -13.793607,16.43944 -8.995829,26.07028 1.728611,3.52777 3.527778,5.60916 6.596949,7.72583 3.4925,2.36361 6.59694,3.35139 12.02972,3.73945 5.3975,0.42333 8.07861,1.02305 11.60639,2.64583 17.56833,8.11389 21.80167,30.05667 8.46667,43.85028 -6.17362,6.42056 -15.38112,9.45444 -24.76501,8.21972 -7.51416,-1.02305 -11.253608,-2.08139 -16.580552,-4.69194 -9.913057,-4.86834 -18.168057,-13.51139 -22.366113,-23.42445 -2.328333,-5.50333 -3.915834,-12.98222 -3.915834,-18.66194 0,-3.56306 0.881945,-9.38389 1.940278,-13.05278 4.621389,-15.83973 17.462501,-28.29278 33.513891,-32.49084 4.09222,-1.05833 4.65667,-1.02305 2.46944,0.0706 z" />
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#venuePaisley)" />
            </svg>

            <button
              type="button"
              className={s.modalClose}
              onClick={() => setOpen(false)}
              aria-label={t("close")}
            >
              ×
            </button>

            <div className={s.modalInner}>
            <h2 className={s.formH}>
              {t("headline")} <i>{t("headlineEm")}</i>
            </h2>
            <p className={s.formSub}>{t("sub")}</p>

            <div className={s.formFields}>
              <label className={s.formField}>
                <div className={s.formFieldLbl}>{t("nameLabel")}</div>
                <input
                  ref={firstFieldRef}
                  className={s.formFieldInput}
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                />
              </label>
              <label className={s.formField}>
                <div className={s.formFieldLbl}>{t("contactLabel")}</div>
                <input
                  className={s.formFieldInput}
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={t("contactPlaceholder")}
                  autoComplete="name"
                />
              </label>
              <label className={s.formField}>
                <div className={s.formFieldLbl}>{t("emailLabel")}</div>
                <input
                  className={s.formFieldInput}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email"
                />
              </label>
              <label className={s.formField}>
                <div className={s.formFieldLbl}>{t("cityLabel")}</div>
                <input
                  className={s.formFieldInput}
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("cityPlaceholder")}
                />
                <div className={s.formFieldHint}>{t("cityHint")}</div>
              </label>
              <label className={s.formField}>
                <div className={s.formFieldLbl}>{t("passwordLabel")}</div>
                <input
                  className={s.formFieldInput}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                  }}
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="new-password"
                />
              </label>
            </div>

            {error ? <div className={s.formError}>{error}</div> : null}

            <button
              type="button"
              className={s.formSubmit}
              disabled={!canSubmit || pending}
              onClick={submit}
            >
              {pending ? "…" : t("cta")}
            </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
