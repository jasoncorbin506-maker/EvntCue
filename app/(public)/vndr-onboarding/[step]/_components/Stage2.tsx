"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { DFW_NEIGHBORHOODS, dfwNeighborhoodLabel } from "@/data/dfw-neighborhoods";
import type { Locale } from "@/i18n/locale";
import { saveStage2Action } from "../_actions/save-stage-2";
import sShell from "../vndr-onboarding-stage.module.css";
import s from "./Stage2.module.css";

/**
 * Stage 2 — Your business.
 *
 * Source: 02_Locked_Prototypes/Vndr/evntcue_vndr_freemium_v1.html lines
 * 874-1054. The form persists via a server action; the Signature Board
 * area is stubbed (V-3 scope per parent brief).
 *
 * Initial values hydrate from props so a returning user sees their prior
 * inputs. authEmail is rendered read-only as context — it's not persisted
 * by this stage (it's already the auth user's email; vendors.contact_email
 * stays NULL until a Phase 4 contact-preference flow adds it).
 *
 * Per Jason's V-1b call: contact_name field dropped (auth email +
 * display_name cover the surface area).
 */
export function Stage2({
  authEmail,
  initial,
}: {
  authEmail: string;
  initial: {
    displayName: string;
    contactPhone: string;
    yearsInBusiness: number | null;
    websiteUrl: string;
    foundingStory: string;
    serviceZips: string[];
  };
}) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("vndr.onboarding.stages.s2");
  const tShell = useTranslations("vndr.onboarding.stages.shell");

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [contactPhone, setContactPhone] = useState(initial.contactPhone);
  const [yearsInBusiness, setYearsInBusiness] = useState(
    initial.yearsInBusiness?.toString() ?? "",
  );
  const [websiteUrl, setWebsiteUrl] = useState(initial.websiteUrl);
  const [foundingStory, setFoundingStory] = useState(initial.foundingStory);
  const [serviceZips, setServiceZips] = useState<Set<string>>(
    new Set(initial.serviceZips),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleZip = (slug: string) => {
    setServiceZips((cur) => {
      const next = new Set(cur);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const canContinue = displayName.trim().length > 0 && !pending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canContinue) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    // Replace any chip checkbox state with our serviceZips Set.
    fd.delete("serviceZips");
    for (const slug of serviceZips) fd.append("serviceZips", slug);
    startTransition(async () => {
      const result = await saveStage2Action(fd);
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      router.push("/vndr-onboarding/3");
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={sShell.captureHead}>
        <div className={sShell.capStepMark}>
          <span>Step 2</span>
          <span className={sShell.capStepLine} aria-hidden="true" />
          <span className={sShell.capStepOf}>of 4</span>
        </div>
        <h1 className={sShell.capQ}>
          {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
        </h1>
        <p className={sShell.capDesc}>{t("description")}</p>
      </div>

      <div className={s.formStack}>
        <div className={s.formRow}>
          <label className={s.fLbl} htmlFor="displayName">
            {t("businessNameLabel")}
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            className={s.fInput}
            placeholder={t("businessNamePlaceholder")}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={120}
            required
          />
          <div className={s.fHelp}>{t("businessNameHelp")}</div>
        </div>

        <div className={s.formRowSplit}>
          <div className={s.formRow}>
            <label className={s.fLbl} htmlFor="authEmailReadonly">
              {t("emailLabel")}
            </label>
            <input
              id="authEmailReadonly"
              type="email"
              className={`${s.fInput} ${s.fInputReadonly}`}
              value={authEmail}
              readOnly
              aria-readonly="true"
            />
            <div className={s.fHelp}>{t("emailHelp")}</div>
          </div>
          <div className={s.formRow}>
            <label className={s.fLbl} htmlFor="contactPhone">
              {t("phoneLabel")}
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              className={s.fInput}
              placeholder={t("phonePlaceholder")}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <div className={s.fHelp}>{t("phoneHelp")}</div>
          </div>
        </div>

        <div className={s.formRow}>
          <label className={s.fLbl} htmlFor="service-zips-grid">
            {t("serviceAreaLabel")}
          </label>
          <div className={s.fHelp}>{t("serviceAreaHelp")}</div>
          <div className={s.areasGrid} id="service-zips-grid" role="group">
            {DFW_NEIGHBORHOODS.map((n) => {
              const on = serviceZips.has(n.slug);
              return (
                <button
                  key={n.slug}
                  type="button"
                  className={`${s.areaChip} ${on ? s.areaChipOn : ""}`}
                  onClick={() => toggleZip(n.slug)}
                  aria-pressed={on}
                >
                  {dfwNeighborhoodLabel(n.slug, locale)}
                </button>
              );
            })}
            <button
              type="button"
              className={`${s.areaChip} ${s.areaChipMiss}`}
              onClick={() => {
                window.alert(t("missingAreaAlert"));
              }}
            >
              {t("missingArea")}
            </button>
          </div>
        </div>

        <div className={s.formRowSplit}>
          <div className={s.formRow}>
            <label className={s.fLbl} htmlFor="yearsInBusiness">
              {t("yearsLabel")}
            </label>
            <input
              id="yearsInBusiness"
              name="yearsInBusiness"
              type="number"
              className={s.fInput}
              placeholder="6"
              min={0}
              max={60}
              value={yearsInBusiness}
              onChange={(e) => setYearsInBusiness(e.target.value)}
            />
          </div>
          <div className={s.formRow}>
            <label className={s.fLbl} htmlFor="websiteUrl">
              {t("websiteLabel")}
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              className={s.fInput}
              placeholder={t("websitePlaceholder")}
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>
        </div>

        <div className={s.formRow}>
          <label className={s.fLbl} htmlFor="foundingStory">
            {t("foundingStoryLabel")}
          </label>
          <textarea
            id="foundingStory"
            name="foundingStory"
            className={s.fText}
            placeholder={t("foundingStoryPlaceholder")}
            value={foundingStory}
            onChange={(e) => setFoundingStory(e.target.value)}
            maxLength={1200}
          />
          <div className={s.fHelp}>{t("foundingStoryHelp")}</div>
        </div>

        {/* Signature Board — stubbed for V-1b. Real editor lands with V-3
         * (mood-board reuse — same dnd-kit + storage bucket primitives). */}
        <div className={s.sigStub}>
          <div className={s.sigStubEye}>{t("sigEyebrow")}</div>
          <h3 className={s.sigStubH}>
            {t.rich("sigHeadline", { em: (chunks) => <em>{chunks}</em> })}
          </h3>
          <p className={s.sigStubDesc}>{t("sigDescription")}</p>
          <span className={s.sigStubTag}>{t("sigComingSoon")}</span>
        </div>
      </div>

      {error && (
        <div className={s.errorBanner} role="alert">
          {error}
        </div>
      )}

      <div className={sShell.capNav}>
        <span className={sShell.capMeta}>{t("metaSavedOnContinue")}</span>
        <button
          type="submit"
          className={`${sShell.btnPrimary} ${!canContinue ? sShell.btnPrimaryDisabled : ""}`}
          disabled={!canContinue}
        >
          {pending ? tShell("saving") : tShell("continue")}
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
    </form>
  );
}
