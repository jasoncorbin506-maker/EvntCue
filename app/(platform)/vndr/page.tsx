import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { Chrome, AskCueButton, NotifButton, ChromeSignOut } from "./_components/Chrome";
import { ResponseWindowAlert } from "./_components/ResponseWindowAlert";
import { PackageRow } from "./_components/PackageRow";
import s from "./vndr.module.css";

/**
 * Vndr portal Home (V-2a).
 *
 * Source mockup: 02_Locked_Prototypes/Vndr/EvntCue_Vndr_P1_Dashboard.html.
 * Translated desktop sidebar+two-col layout into mobile-first single column
 * per Jason's V-2a directive. Sections, top to bottom:
 *
 *   1. Response Window Alert     — countdown card (client; below)
 *   2. Hero Metrics (2x2 grid)   — month rev, conversion, response time, trust
 *   3. Cue Panel                 — Cue guidance card
 *   4. Active Inquiries          — bookings/inquiries list with urgent state
 *   5. Trust Score               — score + sub-metric bars
 *   6. Mini Calendar             — month grid with booked/inquiry/blocked
 *   7. Packages                  — referral % sliders + visibility bars
 *
 * Data: all illustrative for V-2a (mirrors how Venu chunk A shipped — real
 * bindings come in V-2b once we wire current-vendor → packages / inquiries /
 * bookings / trust_metrics tables). The vendor display name + meta come
 * from getCurrentVendor() so the chrome reflects real session state today.
 *
 * If the user is gated by proxy.ts to /vndr but no vendors row exists for
 * their tenant, bounce them through the V-1b onboarding funnel.
 *
 * searchParams.welcome === "signup" surfaces the funnel-completion welcome
 * strip (V-1c bonus, mirrors Venu's discover/?welcome=claim pattern). Strip
 * only renders for that exact param; refreshing /vndr without it hides it.
 * Future "?welcome=claim" support can branch the copy when the Door A claim
 * flow lands its post-claim redirect at /vndr instead of /vndr/discover.
 */
export default async function VndrHome({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const vendor = await getCurrentVendor();
  if (!vendor) {
    redirect("/vndr-onboarding/1");
  }
  const isFirstTimeSignup = welcome === "signup";

  // Display meta — category for now. Real geo (city, state) lands when V-1b
  // Stage 2's service-area fields populate vendors.service_areas. Chrome
  // hides the meta line entirely if nothing's available.
  const metaParts: string[] = [];
  if (vendor.primarySubType) metaParts.push(humanizeSlug(vendor.primarySubType));
  else if (vendor.primaryCategory) metaParts.push(humanizeSlug(vendor.primaryCategory));
  const meta = metaParts.length ? metaParts.join(" · ") : undefined;

  return (
    <>
      <Chrome
        vendorName={vendor.displayName}
        meta={meta}
        right={
          <>
            <AskCueButton />
            <NotifButton hasUnread />
            <ChromeSignOut />
          </>
        }
      />

      {/* Welcome strip — only on funnel completion (?welcome=signup).
       * Persistent (no dismiss), matches Venu's pattern. Copy hardcoded EN
       * to match V-2a portal-interior convention; per-portal i18n pass
       * lands in a future session per START_HERE Phase 5+ note. */}
      {isFirstTimeSignup && (
        <section className={s.welcomeStrip}>
          <div className={s.welcomeEyebrow}>You&apos;re in</div>
          <div className={s.welcomeHeadline}>
            Welcome to EvntCue, <i>{vendor.displayName}</i>.
          </div>
          <p className={s.welcomeBody}>
            Your profile is live. Inquiries land here as Cue matches you to
            events — the response window below ticks down the moment one arrives.
          </p>
        </section>
      )}

      {/* 1 — Response Window Alert (illustrative urgent inquiry) */}
      <ResponseWindowAlert
        eventName="Carter Wedding"
        respondBy="11:42 PM tonight"
        deadlineMs={Date.now() + 1000 * 60 * 60 * 4 + 1000 * 60 * 12}
      />

      {/* 2 — Hero Metrics */}
      <div className={s.heroGrid}>
        <div className={s.heroCard}>
          <div className={s.heroLbl}>This Month</div>
          <div className={s.heroVal}>$8.4K</div>
          <div className={s.heroSub}>
            <span className={s.heroDeltaUp}>↑ 22%</span> vs last
          </div>
          <div className={s.heroBar}>
            <div className={s.heroBarFill} style={{ width: "68%" }} />
          </div>
        </div>
        <div className={s.heroCard}>
          <div className={s.heroLbl}>Conversion</div>
          <div className={s.heroVal}>64%</div>
          <div className={s.heroSub}>
            <span className={s.heroDeltaUp}>↑ 8pts</span> vs last
          </div>
          <div className={s.heroBar}>
            <div className={s.heroBarFill} style={{ width: "64%" }} />
          </div>
        </div>
        <div className={s.heroCard}>
          <div className={s.heroLbl}>Avg Response</div>
          <div className={s.heroVal}>3.2h</div>
          <div className={s.heroSub}>
            <span className={s.heroDeltaUp}>↑ Faster</span>
          </div>
          <div className={s.heroBar}>
            <div className={s.heroBarFill} style={{ width: "82%" }} />
          </div>
        </div>
        <div className={s.heroCard}>
          <div className={s.heroLbl}>Trust Score</div>
          <div className={s.heroVal}>84</div>
          <div className={s.heroSub}>
            <span className={s.heroDeltaUp}>↑ 3</span> this month
          </div>
          <div className={s.heroBar}>
            <div className={s.heroBarFill} style={{ width: "84%" }} />
          </div>
        </div>
      </div>

      {/* 3 — Cue Panel */}
      <div className={s.cuePanel}>
        <div className={s.cueIco}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
          </svg>
        </div>
        <div className={s.cueBody}>
          <div className={s.cueLbl}>Cue says</div>
          <div className={s.cueTxt}>
            Your Plnr referral rate (15%) is below the Audio Visual median (22%). Three
            organizers asked planners for AV last week — raising your rate could surface
            you in those threads.
          </div>
          <div className={s.cueActs}>
            <button type="button" className={s.cueBtnSm}>Tune referrals</button>
            <button type="button" className={s.cueBtnSm}>Dismiss</button>
          </div>
        </div>
      </div>

      {/* 4 — Active Inquiries / Bookings */}
      <section className={s.section}>
        <div className={s.sectionH}>
          <div className={s.sectionT}>Active</div>
          <a href="/vndr/inquiries" className={s.sectionA}>See all</a>
        </div>
        <div className={s.bookingList}>
          <article className={`${s.bk} ${s.bkUrgent}`}>
            <div className={s.bkRow}>
              <div>
                <div className={s.bkEvent}>Carter Wedding</div>
                <div className={s.bkDetail}>250 guests · Outdoor reception · 6h coverage</div>
              </div>
              <span className={`${s.bkBadge} ${s.bbUrg}`}>Urgent</span>
            </div>
            <div className={s.bkMeta}>
              <span>Sat, Jun 13</span>
              <span>Frisco, TX</span>
              <span>$4,200 est.</span>
            </div>
            <div className={s.bkActs}>
              <button type="button" className={s.btnAccept}>Accept</button>
              <button type="button" className={s.btnDecline}>Decline</button>
              <button type="button" className={s.btnView}>View</button>
            </div>
          </article>

          <article className={s.bk}>
            <div className={s.bkRow}>
              <div>
                <div className={s.bkEvent}>Henderson Corporate Gala</div>
                <div className={s.bkDetail}>180 guests · Indoor · 4h coverage</div>
              </div>
              <span className={`${s.bkBadge} ${s.bbNew}`}>New</span>
            </div>
            <div className={s.bkMeta}>
              <span>Fri, Jul 19</span>
              <span>Dallas, TX</span>
              <span>$2,850 est.</span>
            </div>
          </article>

          <article className={s.bk}>
            <div className={s.bkRow}>
              <div>
                <div className={s.bkEvent}>Patel Sangeet</div>
                <div className={s.bkDetail}>320 guests · Ballroom · DJ + AV package</div>
              </div>
              <span className={`${s.bkBadge} ${s.bbConf}`}>Confirmed</span>
            </div>
            <div className={s.bkMeta}>
              <span>Sat, Aug 2</span>
              <span>Plano, TX</span>
              <span>$5,400 booked</span>
            </div>
          </article>
        </div>
      </section>

      {/* 5 — Trust Score */}
      <div className={s.trustCard}>
        <div className={s.sectionH}>
          <div className={s.sectionT}>Trust Score</div>
        </div>
        <div className={s.trustScoreRow}>
          <div className={s.trustBig}>84</div>
          <div className={s.trustBadge}>Strong</div>
        </div>
        <div className={s.trustSub}>Top 18% of Audio Visual vendors in DFW</div>
        <div className={s.trustBars}>
          <div className={s.tbRow}>
            <div className={s.tbLbl}>Response time</div>
            <div className={s.tbTrack}><div className={s.tbFill} style={{ width: "92%" }} /></div>
            <div className={s.tbVal}>92</div>
          </div>
          <div className={s.tbRow}>
            <div className={s.tbLbl}>Show-up rate</div>
            <div className={s.tbTrack}><div className={s.tbFill} style={{ width: "100%" }} /></div>
            <div className={s.tbVal}>100</div>
          </div>
          <div className={s.tbRow}>
            <div className={s.tbLbl}>Reviews</div>
            <div className={s.tbTrack}><div className={s.tbFill} style={{ width: "78%" }} /></div>
            <div className={s.tbVal}>78</div>
          </div>
          <div className={s.tbRow}>
            <div className={s.tbLbl}>Repeat bookings</div>
            <div className={s.tbTrack}><div className={s.tbFill} style={{ width: "66%" }} /></div>
            <div className={s.tbVal}>66</div>
          </div>
        </div>
      </div>

      {/* 6 — Mini Calendar */}
      <div className={s.calCard}>
        <div className={s.calHead}>
          <div className={s.calMon}>June 2026</div>
          <div className={s.calNav}>
            <button type="button" className={s.calNb} aria-label="Previous month">‹</button>
            <button type="button" className={s.calNb} aria-label="Next month">›</button>
          </div>
        </div>
        <div className={s.calGrid}>
          {["S","M","T","W","T","F","S"].map((d, i) => (
            <div key={`dow-${i}`} className={s.calDow}>{d}</div>
          ))}
          {renderCalendarCells()}
        </div>
        <div className={s.calLegend}>
          <div className={s.calLegItem}><span className={s.calLegDot} style={{ background: "var(--teal)" }} />Booked</div>
          <div className={s.calLegItem}><span className={s.calLegDot} style={{ background: "var(--amber)" }} />Inquiry</div>
          <div className={s.calLegItem}><span className={s.calLegDot} style={{ background: "var(--txt3)" }} />Blocked</div>
        </div>
      </div>

      {/* 7 — Packages */}
      <section className={s.section}>
        <div className={s.sectionH}>
          <div className={s.sectionT}>Packages</div>
          <a href="/vndr/profile" className={s.sectionA}>Manage</a>
        </div>
        <div className={s.pkgList}>
          <PackageRow
            name="Essential AV"
            desc="2 speakers · 1 mic · 4h coverage"
            price="$1,200"
            unit="flat"
            referralPct={15}
            visibility="medium"
          />
          <PackageRow
            name="Wedding Premium"
            desc="Full DJ rig · uplighting · 6h coverage"
            price="$2,800"
            unit="flat"
            referralPct={20}
            visibility="high"
          />
          <PackageRow
            name="Corporate Standard"
            desc="Mic + projector · stage lighting · 4h"
            price="$950"
            unit="flat"
            referralPct={10}
            visibility="low"
          />
        </div>
      </section>
    </>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

// Quick slug humanizer — V-1b stored sub_type slugs (e.g., "audio_visual")
// but we want display copy. A real i18n labels module lands in V-2b
// alongside the cert-types pattern from V-1b.
function humanizeSlug(slug: string): string {
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Illustrative June 2026 calendar. June 1, 2026 is a Monday → one leading
 * blank (Sunday). Booked/inquiry/blocked positions match the desktop
 * mockup's pattern; real data wires through V-2b's availability table.
 */
function renderCalendarCells() {
  const cells: React.ReactNode[] = [];
  cells.push(<div key="blank-0" className={s.calD} aria-hidden="true" />);
  for (let day = 1; day <= 30; day++) {
    const className = `${s.calD} ${cellClass(day)}`.trim();
    cells.push(
      <div key={`d-${day}`} className={className}>
        {day}
      </div>,
    );
  }
  return cells;
}

function cellClass(day: number): string {
  if (day === 23) return s.calToday;
  if (day === 13 || day === 2 || day === 27) return s.calBooked;
  if (day === 19) return s.calInquiry;
  if (day === 9 || day === 16) return s.calBlocked;
  return "";
}
