import Link from "next/link";
import { getTranslations } from "next-intl/server";
import s from "./vndr-onboarding.module.css";
import { Calculator } from "./Calculator";

/**
 * Public marketing landing for the Vndr portal — /vndr-onboarding.
 *
 * Source: 02_Locked_Prototypes/Vndr/evntcue_vndr_freemium_v1.html Stage 0
 * (lines 576–774) ported through the Venu landing's mobile-first .phone frame
 * (per Jason's call 2026-05-22: mirror Venu's mobile pattern, not Orgnz's
 * funnel pattern). Mobile-first edge-to-edge at <640px; phone-frame preview
 * on desktop.
 *
 * Per master spec §75 + Lock 25 v2a: vendor profile is free forever; the
 * only charge is a consolidated commission per booking (Vndr Free 7.5%
 * all-in / Pro 6% all-in — Stripe processing baked into the rate). The
 * one-glance rule is the load-bearing constraint — every pricing surface
 * must lead with the take-home, never with a rate-tier matrix.
 *
 * Coral accent (#E8622A) per CLAUDE.md 2026-05-05 portal table.
 */

export async function generateMetadata() {
  const t = await getTranslations("vndr.onboarding");
  return {
    title: `${t("rolePill")} · EvntCue`,
    description: t("metaDescription"),
  };
}

export default async function VndrOnboardingPage() {
  const t = await getTranslations("vndr.onboarding");

  return (
    <main className={s.phone}>
      {/* Public chrome */}
      <header className={s.pubChrome}>
        <div className={s.pubBrand}>
          <svg
            className={s.pubMark}
            viewBox="0 0 44 44"
            width="30"
            height="30"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <line x1="22" y1="6" x2="22" y2="22" stroke="#E8622A" strokeWidth="1.2" strokeOpacity="0.6" />
            <line x1="22" y1="22" x2="10" y2="38" stroke="#E8622A" strokeWidth="1" strokeOpacity="0.55" />
            <line x1="22" y1="22" x2="22" y2="38" stroke="#E8622A" strokeWidth="1" strokeOpacity="0.55" />
            <line x1="22" y1="22" x2="34" y2="38" stroke="#E8622A" strokeWidth="1" strokeOpacity="0.55" />
            <circle cx="10" cy="38" r="1.7" fill="#F5A882" opacity="0.8" />
            <circle cx="22" cy="38" r="1.7" fill="#F5A882" opacity="0.75" />
            <circle cx="34" cy="38" r="1.7" fill="#F5A882" opacity="0.8" />
            <circle cx="22" cy="6" r="3.8" fill="none" stroke="#E8622A" strokeWidth="0.8" opacity="0.4" />
            <circle cx="22" cy="6" r="2.4" fill="#E8622A" />
            <circle cx="22" cy="6" r="1.2" fill="#F5A882" />
          </svg>
          <div className={s.pubWordmark}>EvntCue</div>
        </div>
        <div className={s.pubRolePill}>{t("rolePill")}</div>
      </header>

      {/* Hero */}
      <section className={s.heroWrap}>
        <div className={s.heroBg} aria-hidden="true" />
        <div className={s.heroEyebrow}>{t("hero.eyebrow")}</div>
        <h1 className={s.heroHAction}>{t("hero.headlineAction")}</h1>
        <p className={s.heroSub}>
          {t.rich("hero.sub", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <Link href="#calc" className={s.heroCta}>
          {t("hero.cta")}
        </Link>
      </section>

      {/* Proof strip — port of `land-trust` from freemium v1 lines 590-594 */}
      <section className={s.proofStrip}>
        <div className={s.proofItem}>
          <div className={s.proofNum}>$0</div>
          <div className={s.proofLbl}>{t("proof.listing")}</div>
        </div>
        <div className={s.proofItem}>
          <div className={s.proofNum}>92%</div>
          <div className={s.proofLbl}>{t("proof.takeHome")}</div>
        </div>
        <div className={s.proofItem}>
          <div className={s.proofNum}>48 hrs</div>
          <div className={s.proofLbl}>{t("proof.payout")}</div>
        </div>
      </section>

      {/* Comparison strip — vertical-stack of 4 rows for mobile.
       * Source: freemium v1 lines 635–667 (compare-strip). The desktop
       * mockup uses a 4-column grid; we stack vertically with a highlighted
       * "us" row at the bottom so the eye lands on EvntCue last per §75. */}
      <section className={s.compareSection}>
        <div className={s.compareHead}>
          <div className={s.compareEye}>{t("compare.eye")}</div>
          <h2 className={s.compareH}>
            {t.rich("compare.h", {
              access: (chunks) => <em>{chunks}</em>,
              paid: (chunks) => <em>{chunks}</em>,
            })}
          </h2>
          <p className={s.compareSub}>{t("compare.sub")}</p>
        </div>
        <div className={s.compareList}>
          <div className={s.compareRow}>
            <div className={s.compareName}>Thumbtack</div>
            <div className={s.compareRate}>
              15–30<em>%</em>
            </div>
            <div className={s.compareNote}>{t("compare.thumbtackNote")}</div>
          </div>
          <div className={s.compareRow}>
            <div className={s.compareName}>Eventbrite</div>
            <div className={s.compareRate}>
              10–14<em>%</em>
            </div>
            <div className={s.compareNote}>{t("compare.eventbriteNote")}</div>
          </div>
          <div className={s.compareRow}>
            <div className={s.compareName}>HoneyBook</div>
            <div className={s.compareRate}>
              3<em>%</em>
            </div>
            <div className={s.compareNote}>{t("compare.honeybookNote")}</div>
          </div>
          <div className={`${s.compareRow} ${s.compareRowUs}`}>
            <div className={s.compareTag}>{t("compare.bestTag")}</div>
            <div className={`${s.compareName} ${s.compareNameUs}`}>EvntCue Listed</div>
            <div className={`${s.compareRate} ${s.compareRateUs}`}>
              7.5<em>%</em>
            </div>
            <div className={s.compareNote}>{t("compare.evntcueNote")}</div>
          </div>
        </div>
      </section>

      {/* "What free actually means" — port of `what-section` lines 669–708 */}
      <section className={s.whatSection}>
        <h2 className={s.whatH}>
          {t.rich("what.h", { em: (chunks) => <em>{chunks}</em> })}
        </h2>
        <p className={s.whatP}>{t("what.p")}</p>
        <div className={s.whatList}>
          <div className={s.whatRow}>
            <div className={s.whatIco}>
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <circle cx="9" cy="9" r="6.5" />
                <circle cx="9" cy="9" r="2" />
              </svg>
            </div>
            <div className={s.whatBody}>
              <div className={s.whatName}>{t("what.b1.name")}</div>
              <div className={s.whatSub}>{t("what.b1.sub")}</div>
            </div>
          </div>
          <div className={s.whatRow}>
            <div className={s.whatIco}>
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <path d="M3 9h12m-4-4 4 4-4 4" />
              </svg>
            </div>
            <div className={s.whatBody}>
              <div className={s.whatName}>{t("what.b2.name")}</div>
              <div className={s.whatSub}>{t("what.b2.sub")}</div>
            </div>
          </div>
          <div className={s.whatRow}>
            <div className={s.whatIco}>
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <circle cx="9" cy="9" r="6.5" />
                <path d="M9 5v4l2.5 2" />
              </svg>
            </div>
            <div className={s.whatBody}>
              <div className={s.whatName}>{t("what.b3.name")}</div>
              <div className={s.whatSub}>{t("what.b3.sub")}</div>
            </div>
          </div>
          <div className={s.whatRow}>
            <div className={s.whatIco}>
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <path d="M9 2v3M9 13v3M2 9h3M13 9h3M4.2 4.2l2 2M11.8 11.8l2 2M4.2 13.8l2-2M11.8 6.2l2-2" />
              </svg>
            </div>
            <div className={s.whatBody}>
              <div className={s.whatName}>{t("what.b4.name")}</div>
              <div className={s.whatSub}>{t("what.b4.sub")}</div>
            </div>
          </div>
        </div>
        <div className={s.whatAside}>{t("what.aside")}</div>
      </section>

      {/* Take-home calculator (interactive — client) */}
      <Calculator />

      {/* Footer */}
      <footer className={s.pubFooter}>
        <div className={s.pubFooterLine}>
          {t.rich("footerSignedIn", {
            link: (chunks) => <Link href="/login?role=vndr">{chunks}</Link>,
          })}
        </div>
      </footer>
    </main>
  );
}
