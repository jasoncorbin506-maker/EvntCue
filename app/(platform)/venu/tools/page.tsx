import { redirect } from "next/navigation";
import { Chrome, LivePill, ChromeSignOut } from "../_components/Chrome";
import { ToolRow } from "../_components/ToolRow";
import { commissionFlowLabel } from "@/lib/labels/commission-flows";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import s from "../venu.module.css";

/**
 * Venu Tools tab — chunk C visual port.
 *
 * Per Venu_Locked_2026-05-13.md row 4: 5 cross-event tools (Venu Live ·
 * Preferred · Atmosphere Board · Your spaces · Commission flows) + an
 * expanded Pro pitch block at the bottom.
 *
 * Spine-of-the-platform principle: only CROSS-EVENT work lives here.
 * Anything event_id-scoped (BEO, seat chart, etc.) is inside the event
 * detail view per chunk B.
 *
 * Source mockup: Screen 1 (lines ~386–528).
 *
 * Open design items per PARKING_LOT #45 — three rows route to placeholder
 * exits until Jason resolves the design:
 * - Venu Live cockpit interior (reuse Orgnz Run-of-Show vs new — open)
 * - Per-space detail view (open)
 * - Commission-flows configuration sheet (open)
 *
 * Pro upsell pricing locked at $199/mo · $169/mo annual per Lock 3 closure
 * (2026-05-16). The mockup's $149/$129 was a placeholder per PARKING_LOT
 * #21 — superseded.
 */
export default async function VenuTools() {
  const venue = await getCurrentVenue();
  if (!venue) redirect("/venues");

  // Commission flows row sub-text — Lock 15 demonstration. The four flows a
  // venue typically lives in, routed through the canonical label map.
  const venueFlows = [
    commissionFlowLabel.venue_in_house,
    commissionFlowLabel.venue_fb_surcharge,
    commissionFlowLabel.venue_kickback,
    commissionFlowLabel.venue_referral,
  ].join(" · ");

  return (
    <>
      <Chrome
        venueName={venue.displayName}
        roleLabel="Tools"
        right={
          <>
            <LivePill />
            <ChromeSignOut />
          </>
        }
        backHref="/venu/discover"
      />

      {/* Tools hero — "For everything that spans bookings" */}
      <section className={s.toolsHero}>
        <div className={s.toolsHeroIco}>
          <svg viewBox="0 0 24 24">
            <path d="M14.7 6.3a4.5 4.5 0 0 1 6.4 6.3l-9.6 9.6a2.5 2.5 0 0 1-3.5-3.5L17 9.7" />
            <path d="M3 13l4 4" />
            <path d="M9 7l3 3" />
          </svg>
        </div>
        <div className={s.toolsHeroBody}>
          <div className={s.toolsHeroEyebrow}>Cross-event tools</div>
          <div className={s.toolsHeroH}>
            For everything that <b>spans bookings.</b>
          </div>
        </div>
      </section>

      {/* Included-free category */}
      <section className={s.toolCat}>
        <div className={s.toolCatH}>
          <div className={s.toolCatT}>Included free</div>
          <div className={s.toolCatLine} />
        </div>
        <div className={s.toolList}>
          <ToolRow
            href="/venu/tools/live"
            disabled
            name="Venu Live"
            sub="Day-of cockpit · vendor check-in · timeline"
            badge={{ label: "Saturday", tone: "live" }}
            icon={
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
              </svg>
            }
          />
          <ToolRow
            href="/venu/tools/preferred"
            disabled
            name="Preferred list"
            sub="Vendors, caterers, planners you trust"
            icon={
              <svg viewBox="0 0 24 24">
                <circle cx="9" cy="9" r="6" />
                <path d="M21 21l-5.2-5.2" />
              </svg>
            }
          />
          <ToolRow
            href="/venu/tools/atmosphere"
            disabled
            name="Atmosphere Board"
            sub="Photos that teach Cue how to match"
            icon={
              <svg viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="11" r="2" />
                <path d="M21 17l-5-5-9 9" />
              </svg>
            }
          />
          <ToolRow
            href="/venu/tools/spaces"
            name="Your spaces"
            sub="Up to 3 · pricing · layouts · availability"
            icon={
              <svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M4 10h16M10 4v16" />
              </svg>
            }
          />
          <ToolRow
            href="/venu/tools/commission-flows"
            disabled
            name="Commission flows"
            sub={venueFlows}
            icon={
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="9" />
                <path d="M12 9V5M12 19v-4M9 12H5M19 12h-4" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Pro upsell block */}
      <section className={s.proBlock}>
        <div className={s.proHead}>
          <div className={s.proEyebrow}>When you outgrow free</div>
          <div className={s.proH}>
            Move into <i>Professional</i>
          </div>
          <div className={s.proSub}>
            For venues running real relationships, more than three spaces, or deeper numbers.
            Same product — three doors that weren&apos;t there before.
          </div>
        </div>

        <div className={s.proFeatures}>
          <div className={s.proFeature}>
            <div className={s.proFeatureIco}>
              <svg viewBox="0 0 24 24">
                <circle cx="9" cy="8" r="4" />
                <path d="M3 21v-1a6 6 0 0 1 12 0v1" />
                <path d="M16 4a4 4 0 0 1 0 8M22 21v-1a6 6 0 0 0-3-5.2" />
              </svg>
            </div>
            <div className={s.proFeatureBody}>
              <div className={s.proFeatureName}>Client CRM</div>
              <div className={s.proFeatureDesc}>
                Repeat couples, referral tracking, follow-up reminders, contact history across every event.
              </div>
            </div>
          </div>
          <div className={s.proFeature}>
            <div className={s.proFeatureIco}>
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div className={s.proFeatureBody}>
              <div className={s.proFeatureName}>Unlimited spaces</div>
              <div className={s.proFeatureDesc}>
                Beyond three spaces · per-space pricing · cross-space inventory · multi-venue dashboards.
              </div>
            </div>
          </div>
          <div className={s.proFeature}>
            <div className={s.proFeatureIco}>
              <svg viewBox="0 0 24 24">
                <path d="M3 3v18h18" />
                <path d="M7 17l3-5 4 2 5-9" />
                <circle cx="7" cy="17" r="1.5" />
                <circle cx="10" cy="12" r="1.5" />
                <circle cx="14" cy="14" r="1.5" />
                <circle cx="19" cy="5" r="1.5" />
              </svg>
            </div>
            <div className={s.proFeatureBody}>
              <div className={s.proFeatureName}>Deeper reporting</div>
              <div className={s.proFeatureDesc}>
                Booking trends · source attribution · YoY · seasonality · CSV exports.
              </div>
            </div>
          </div>
        </div>

        <div className={s.proPricing}>
          <div className={s.proPriceMain}>
            <div className={s.proPriceAmt}>
              <i>$199</i>
              <span className={s.proPricePer}>/month</span>
            </div>
            <div className={s.proPriceAlt}>
              Or <b>$169/mo</b> annual · two months free
            </div>
          </div>
        </div>

        <div className={s.proCtas}>
          <button type="button" className={`${s.proCta} ${s.proCtaSecondary}`}>
            See a tour
          </button>
          <button type="button" className={`${s.proCta} ${s.proCtaPrimary}`}>
            Start Pro
          </button>
        </div>
      </section>
    </>
  );
}
