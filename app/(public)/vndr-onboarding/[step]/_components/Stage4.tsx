"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CERT_TYPES,
  certTypeDescription,
  certTypeLabel,
  certTypeTag,
  type CertTypeKey,
} from "@/lib/labels/cert-types";
import type { Locale } from "@/i18n/locale";
import { uploadCertAction } from "../_actions/upload-cert";
import { finishOnboardingAction } from "../_actions/finish-onboarding";
import sShell from "../vndr-onboarding-stage.module.css";
import s from "./Stage4.module.css";

/**
 * Stage 4 — Verify & connect.
 *
 * Source: 02_Locked_Prototypes/Vndr/evntcue_vndr_freemium_v1.html lines
 * 1198-1301. Simplified for V-1b (Lock 14 amendment 2026-05-23 removed
 * Dessert & Bar from Vndr → no conditional TABC / food_handler reveal):
 * two cert cards (COI, business license) shown unconditionally.
 *
 * Cert upload UX: each card has a hidden file input triggered by the Upload
 * button. On selection, uploadCertAction runs; on success, the card shows
 * "Uploaded ✓". Optimistic state — re-upload overwrites both bucket file +
 * tenant_certifications row (server side handles upsert).
 *
 * Finish button is always enabled (soft gates per §75). finishOnboardingAction
 * flips claim_status to 'published' and server-side redirects to the V-2
 * dashboard placeholder (/vndr/discover?welcome=signup, currently a 404
 * stub — that's fine, V-2 ports the dashboard).
 */

const STAGE_FOUR_CERTS: readonly CertTypeKey[] = [
  "general_liability_insurance",
  "business_license",
];

export function Stage4({
  uploadedInitial,
}: {
  uploadedInitial: readonly CertTypeKey[];
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("vndr.onboarding.stages.s4");
  const tShell = useTranslations("vndr.onboarding.stages.shell");
  const [uploaded, setUploaded] = useState<Set<CertTypeKey>>(
    new Set(uploadedInitial),
  );
  const [pendingCert, setPendingCert] = useState<CertTypeKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishPending, startFinishTransition] = useTransition();

  // Refs for the hidden file inputs — one per cert card.
  const fileInputRefs = useRef<Partial<Record<CertTypeKey, HTMLInputElement | null>>>({});

  const handleUploadClick = (certType: CertTypeKey) => {
    const input = fileInputRefs.current[certType];
    if (input) input.click();
  };

  const handleFileChange = async (
    certType: CertTypeKey,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPendingCert(certType);

    const fd = new FormData();
    fd.append("certType", certType);
    fd.append("file", file);

    try {
      const result = await uploadCertAction(fd);
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      setUploaded((cur) => new Set(cur).add(certType));
    } finally {
      setPendingCert(null);
      // Reset the input so picking the same file again re-fires onChange.
      if (fileInputRefs.current[certType]) {
        fileInputRefs.current[certType]!.value = "";
      }
    }
  };

  const handleFinish = () => {
    if (finishPending) return;
    setError(null);
    startFinishTransition(async () => {
      const result = await finishOnboardingAction();
      // finishOnboardingAction redirects on success (throws NEXT_REDIRECT,
      // never returns). A non-void return means an error occurred.
      if (result && result.ok === false) {
        setError(result.error);
      }
    });
  };

  return (
    <>
      <div className={sShell.captureHead}>
        <div className={sShell.capStepMark}>
          <span>Step 4</span>
          <span className={sShell.capStepLine} aria-hidden="true" />
          <span className={sShell.capStepOf}>of 4</span>
        </div>
        <h1 className={sShell.capQ}>
          {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
        </h1>
        <p className={sShell.capDesc}>{t("description")}</p>
      </div>

      <div className={sShell.cueRead}>
        <div className={sShell.cueReadMark}>✦</div>
        <div className={sShell.cueReadBody}>
          <div className={sShell.cueReadTag}>{t("cueTag")}</div>
          <div className={sShell.cueReadTxt}>{t("cueText")}</div>
        </div>
      </div>

      <div className={s.uploadStack}>
        {STAGE_FOUR_CERTS.map((certKey) => {
          const entry = CERT_TYPES.find((c) => c.key === certKey);
          if (!entry) return null;
          const isUploaded = uploaded.has(certKey);
          const isPending = pendingCert === certKey;
          return (
            <div key={certKey} className={s.uploadCard}>
              <div className={s.ucIco}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M9 1.5l5.5 2v5c0 3.5-2.3 6.5-5.5 7.5-3.2-1-5.5-4-5.5-7.5v-5L9 1.5z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className={s.ucBody}>
                <div className={s.ucH}>
                  <span>{certTypeLabel(certKey, locale)}</span>
                  <span
                    className={`${s.ucTag} ${entry.gateType === "optional" ? s.ucTagOptional : ""}`}
                  >
                    {certTypeTag(certKey, locale)}
                  </span>
                </div>
                <div className={s.ucD}>{certTypeDescription(certKey, locale)}</div>
              </div>
              <input
                ref={(el) => {
                  fileInputRefs.current[certKey] = el;
                }}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,application/pdf,image/png,image/jpeg,image/webp,image/heic"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(certKey, e)}
              />
              <button
                type="button"
                className={`${s.ucBtn} ${isUploaded ? s.ucBtnUploaded : ""} ${isPending ? s.ucBtnPending : ""}`}
                onClick={() => !isUploaded && handleUploadClick(certKey)}
                disabled={isPending}
              >
                {isPending
                  ? t("uploadingLabel")
                  : isUploaded
                    ? t("uploadedLabel")
                    : t("uploadLabel")}
              </button>
            </div>
          );
        })}
      </div>

      {/* Escrow explainer — the strategic feature per master spec §75 / Cue
       * Training Notes pattern #7. Ported verbatim from freemium v1. */}
      <div className={s.escrowCard}>
        <div className={s.escrowEye}>{t("escrowEye")}</div>
        <h2 className={s.escrowH}>
          {t.rich("escrowH", { em: (chunks) => <em>{chunks}</em> })}
        </h2>
        <p className={s.escrowSub}>{t("escrowSub")}</p>
        <div className={s.escrowFlow}>
          <div className={s.efStep}>
            <div className={s.efNum}>1</div>
            <div className={s.efBody}>
              <div className={s.efT}>{t("escrowStep1T")}</div>
              <div className={s.efD}>
                {t.rich("escrowStep1D", { em: (chunks) => <em>{chunks}</em> })}
              </div>
            </div>
          </div>
          <div className={s.efStep}>
            <div className={s.efNum}>2</div>
            <div className={s.efBody}>
              <div className={s.efT}>{t("escrowStep2T")}</div>
              <div className={s.efD}>{t("escrowStep2D")}</div>
            </div>
          </div>
          <div className={s.efStep}>
            <div className={s.efNum}>3</div>
            <div className={s.efBody}>
              <div className={s.efT}>{t("escrowStep3T")}</div>
              <div className={s.efD}>{t("escrowStep3D")}</div>
            </div>
          </div>
        </div>
        <p className={s.escrowFoot}>
          {t.rich("escrowFoot", { em: (chunks) => <em>{chunks}</em> })}
        </p>
      </div>

      {/* Stripe Connect stub — real wiring lands with Phase 4. */}
      <div className={s.stripeCard}>
        <div className={s.stripeIc}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 2v16M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className={s.stripeBody}>
          <div className={s.stripeH}>{t("stripeH")}</div>
          <div className={s.stripeD}>{t("stripeD")}</div>
          <div className={s.stripeStub}>{t("stripeStub")}</div>
        </div>
      </div>

      {error && (
        <div className={s.errorBanner} role="alert">
          {error}
        </div>
      )}

      <div className={sShell.capNav}>
        <span className={sShell.capMeta}>{t("metaFinal")}</span>
        <button
          type="button"
          className={`${sShell.btnPrimary} ${finishPending ? sShell.btnPrimaryDisabled : ""}`}
          onClick={handleFinish}
          disabled={finishPending}
        >
          {finishPending ? tShell("publishing") : t("finish")}
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10m-4-4 4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
