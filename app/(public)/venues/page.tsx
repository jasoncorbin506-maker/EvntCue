import Link from "next/link";
import s from "./venues.module.css";

/**
 * Public marketing landing for the Venu portal — /venues.
 *
 * Source: 02_Locked_Prototypes/Venu/EvntCue_Venu_Landing_v3.html.
 * Texas-calibrated operational-competence register per Lock 14b — frames
 * EvntCue as a tool that respects existing venue competence, not a platform
 * recruiting venues to new behaviors. Cultural pluralism embedded in one
 * italic phrase ("the weddings, the quinces, the bar mitzvahs, the
 * corporate galas") — Lock 14 cultural-copy boundary respected (no
 * subtype-with-money concatenation; pluralism appears as the venue's
 * existing work, not a recruitment criterion).
 *
 * Per the lock doc: NO search field, NO ghost-pool lookup, NO public
 * discovery of any kind. Single "Get started" CTA → /venues/start.
 *
 * Renames "For Venus" pill from the mockup to "For Venues" — the mockup's
 * typo / clever-spelling experiment isn't part of the locked brand.
 */
export default function VenuesPublicLanding() {
  return (
    <main className={s.phone}>
      {/* Public chrome */}
      <header className={s.pubChrome}>
        <div className={s.pubBrand}>
          <div className={s.pubMark} aria-hidden="true" />
          <div className={s.pubWordmark}>EvntCue</div>
        </div>
        <div className={s.pubRolePill}>For Venues</div>
      </header>

      {/* Hero */}
      <section className={s.heroWrap}>
        <div className={s.heroBg} aria-hidden="true" />
        <div className={s.heroEyebrow}>Built in DFW for DFW venues</div>
        <h1 className={s.heroHAction}>List your space.</h1>
        <div className={s.heroHPositioning}>The way you already run it.</div>
        <p className={s.heroSub}>
          You&apos;ve hosted{" "}
          <i>the weddings, the quinces, the bar mitzvahs, the corporate galas.</i>{" "}
          EvntCue gives you the workflow to keep doing it — cleanly, profitably, on your terms.
        </p>
        <Link href="/venues/start" className={s.heroCta}>
          Get started
        </Link>
      </section>

      {/* Proof strip — Lock 25 v2a proof points. Lead with zero buyer
          friction (the v2a structural differentiator) over historical
          fee-floor framing. */}
      <section className={s.proofStrip}>
        <div className={s.proofItem}>
          <div className={s.proofNum}>0%</div>
          <div className={s.proofLbl}>Organizer fee · every tier</div>
        </div>
        <div className={s.proofItem}>
          <div className={s.proofNum}>3 spaces</div>
          <div className={s.proofLbl}>Free tier · always</div>
        </div>
        <div className={s.proofItem}>
          <div className={s.proofNum}>~2 min</div>
          <div className={s.proofLbl}>To verify &amp; list</div>
        </div>
      </section>

      {/* What you get */}
      <section className={s.whatSection}>
        <h2 className={s.whatH}>What you get</h2>
        <div className={s.whatList}>
          <div className={s.whatRow}>
            <div className={s.whatIco}>
              <svg viewBox="0 0 24 24">
                <path d="M4 7h16v12H4z" />
                <path d="M4 7l8 6 8-6" />
              </svg>
            </div>
            <div className={s.whatBody}>
              <div className={s.whatName}>Qualified inquiries only</div>
              <div className={s.whatSub}>
                Families come with escrow held. No tire-kickers, no fake leads.
              </div>
            </div>
          </div>

          <div className={s.whatRow}>
            <div className={s.whatIco}>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className={s.whatBody}>
              <div className={s.whatName}>Day-of cockpit</div>
              <div className={s.whatSub}>
                Vendor check-in, live timeline, BEO acknowledgment. Run the event from your phone.
              </div>
            </div>
          </div>

          <div className={s.whatRow}>
            <div className={s.whatIco}>
              <svg viewBox="0 0 24 24">
                <path d="M12 4v16M7 8h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" />
              </svg>
            </div>
            <div className={s.whatBody}>
              <div className={s.whatName}>Your commission flows, intact</div>
              <div className={s.whatSub}>
                In-house, F&amp;B surcharge, referral fees, sourcing. The way you&apos;ve always done it, just on rails.
              </div>
            </div>
          </div>

          <div className={s.whatRow}>
            <div className={s.whatIco}>
              <svg viewBox="0 0 24 24">
                <circle cx="9" cy="9" r="6" />
                <path d="M21 21l-5.2-5.2" />
              </svg>
            </div>
            <div className={s.whatBody}>
              <div className={s.whatName}>Your preferred vendors stay yours</div>
              <div className={s.whatSub}>
                Keep the relationships you&apos;ve built. Add new ones when you want to.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={s.howSection}>
        <h2 className={s.howH}>How it works</h2>
        <div className={s.howList}>
          <div className={s.howRow}>
            <div className={s.howNum}>1</div>
            <div className={s.howBody}>
              <div className={s.howName}>Verify your venue</div>
              <div className={s.howSub}>Property record + insurance · ~2 minutes</div>
            </div>
          </div>
          <div className={s.howRow}>
            <div className={s.howNum}>2</div>
            <div className={s.howBody}>
              <div className={s.howName}>Build your profile</div>
              <div className={s.howSub}>Spaces, pricing, photos, commission flows</div>
            </div>
          </div>
          <div className={s.howRow}>
            <div className={s.howNum}>3</div>
            <div className={s.howBody}>
              <div className={s.howName}>Take real inquiries</div>
              <div className={s.howSub}>When DFW families start finding you, you&apos;re ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={s.pubFooter}>
        <div className={s.pubFooterLine}>
          Already on EvntCue? <Link href="/login?role=venue">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}
