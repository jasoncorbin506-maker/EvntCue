import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { getOldestUnrespondedInquiry } from "@/lib/vndr/oldest-unresponded-inquiry";
import { getVndrHeroMetrics } from "@/lib/vndr/hero-metrics";
import { getVndrActivePipeline } from "@/lib/vndr/active-pipeline";
import { getVndrCalendarMonth } from "@/lib/vndr/calendar-month";
import { getVndrAvailabilityBlocksForMonth } from "@/lib/vndr/availability";
import { getVndrPackages } from "@/lib/vndr/packages";
import { getVendorProfile } from "@/lib/vndr/profile";
import { assembleVndrHomeCue } from "@/lib/cue/vndr-home-prompt";
import { getVendorCueDismissals } from "@/lib/cue/vndr-cue-dismissals";
import { getPendingReviewPromptsForVendor } from "@/lib/reviews/event-reviews";
import { Chrome, AskCueButton, NotifButton, ChromeSignOut } from "./_components/Chrome";
import { ResponseWindowAlert } from "./_components/ResponseWindowAlert";
import { PackagesSection } from "./_components/PackagesSection";
import { MiniCalendar } from "./_components/MiniCalendar";
import { CuePanel } from "./_components/CuePanel";
import { ReviewPromptsCard } from "./_components/ReviewPromptsCard";
import s from "./vndr.module.css";

/**
 * Vndr portal Home (V-2b — real-data wiring).
 *
 * V-2a (commit 1292eb8 + edbb8da) shipped this page with hardcoded
 * illustrative state on all 7 sections. V-2b wires real data per Cowork
 * brief inbox-cc/2026-05-24-v2b-vndr-home-real-data-wiring.md:
 *
 *   1. Response Window Alert  — oldest unresponded inquiry + 24h SLA
 *   2. Hero Metrics (2x2)     — bookings, conversion, response time, trust
 *   3. Cue Panel              — assembleVndrHomeCue() guidance ladder
 *   4. Active pipeline        — top 5 inquiries+bookings by urgency
 *   5. Trust Score            — weighted formula (reviews 40 / response 30 /
 *                               completion 20 / profile 10) per Jason 2026-05-24
 *   6. Mini Calendar          — current month booked/inquiry/blocked + tap to
 *                               manage availability blocks (whole or partial-day)
 *   7. Packages               — vendor's vndr_packages with slider + visibility
 *                               wired to updatePackageFields server action
 *
 * Empty states are honest — a brand-new vendor with no inquiries/bookings sees
 * the alert suppressed (per brief: "don't show '0 active inquiries'"), zero
 * metrics, Cue's onboarding-progress guidance, an empty pipeline section, a
 * low trust score (mostly profile completeness), an open calendar, and an
 * empty packages list.
 *
 * Loaded in parallel via Promise.all to keep TTFB tight. Trust score is
 * computed on-the-fly per V-2b brief §5 (materialization is a Phase-5
 * optimization, not a launch requirement).
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

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Load all 7 data sources in parallel. Trust score is inside hero-metrics
  // (computed alongside the 4 tile values). Profile is fetched for the
  // MiniCalendar's defaultCommissionPct prop — V-2b smoke-fix session 23
  // surfaces vendor's default commission in the per-date override sheet.
  const [
    oldestUnresponded,
    heroMetrics,
    activePipeline,
    calendarMonth,
    blocks,
    packages,
    vendorProfile,
    reviewPrompts,
    cueDismissedKeys,
  ] = await Promise.all([
    getOldestUnrespondedInquiry(vendor.tenantId),
    getVndrHeroMetrics(vendor),
    getVndrActivePipeline(vendor.tenantId, 5),
    getVndrCalendarMonth(vendor.tenantId, year, month),
    getVndrAvailabilityBlocksForMonth(vendor.tenantId, year, month),
    getVndrPackages(vendor.tenantId),
    getVendorProfile(vendor.tenantId),
    getPendingReviewPromptsForVendor(vendor.tenantId),
    getVendorCueDismissals(vendor.tenantId),
  ]);

  const defaultCommissionPct = vendorProfile?.referralRatePct ?? null;

  const cueBranches = assembleVndrHomeCue({
    metrics: heroMetrics,
    oldestUnresponded,
    vendor,
  });

  // Display meta — category for now. Real geo (city, state) lands when V-1b
  // Stage 2's service-area fields populate vendors.service_areas.
  const metaParts: string[] = [];
  if (vendor.primarySubType) metaParts.push(humanizeSlug(vendor.primarySubType));
  else if (vendor.primaryCategory) metaParts.push(humanizeSlug(vendor.primaryCategory));
  const meta = metaParts.length ? metaParts.join(" · ") : undefined;

  const responseTimeDisplay =
    heroMetrics.avgResponseHours === null
      ? "—"
      : `${heroMetrics.avgResponseHours}h`;

  return (
    <>
      <Chrome
        vendorName={vendor.displayName}
        meta={meta}
        right={
          <>
            <AskCueButton />
            <NotifButton hasUnread={oldestUnresponded !== null} />
            <ChromeSignOut />
          </>
        }
      />

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

      {/* 1 — Response Window Alert (suppressed when no unresponded inquiries) */}
      {oldestUnresponded && <ResponseWindowAlert inquiry={oldestUnresponded} />}

      {/* 2 — Hero Metrics */}
      <div className={s.heroGrid}>
        <div className={s.heroCard}>
          <div className={s.heroLbl}>Bookings · This Month</div>
          <div className={s.heroVal}>{heroMetrics.bookingsThisMonth}</div>
          <div className={s.heroSub}>
            {heroMetrics.bookingsThisMonth === 0 ? "—" : "confirmed"}
          </div>
          <div className={s.heroBar}>
            <div
              className={s.heroBarFill}
              style={{ width: `${Math.min(100, heroMetrics.bookingsThisMonth * 20)}%` }}
            />
          </div>
        </div>
        <div className={s.heroCard}>
          <div className={s.heroLbl}>Conversion</div>
          <div className={s.heroVal}>{heroMetrics.conversionRatePct}%</div>
          <div className={s.heroSub}>last 90 days</div>
          <div className={s.heroBar}>
            <div
              className={s.heroBarFill}
              style={{ width: `${heroMetrics.conversionRatePct}%` }}
            />
          </div>
        </div>
        <div className={s.heroCard}>
          <div className={s.heroLbl}>Avg Response</div>
          <div className={s.heroVal}>{responseTimeDisplay}</div>
          <div className={s.heroSub}>last 30 days</div>
          <div className={s.heroBar}>
            <div
              className={s.heroBarFill}
              style={{
                width: `${
                  heroMetrics.avgResponseHours === null
                    ? 0
                    : Math.max(
                        0,
                        100 - heroMetrics.avgResponseHours * 4,
                      )
                }%`,
              }}
            />
          </div>
        </div>
        <div className={s.heroCard}>
          <div className={s.heroLbl}>Trust Score</div>
          <div className={s.heroVal}>{heroMetrics.trustScore.total}</div>
          <div className={s.heroSub}>{tierLabel(heroMetrics.trustScore.tier)}</div>
          <div className={s.heroBar}>
            <div
              className={s.heroBarFill}
              style={{ width: `${heroMetrics.trustScore.total}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 — Cue Panel. V-2c Session 3 (mig 064): dismiss is permanent +
          cross-device via vendor_cue_dismissals; server passes the
          dismissedKeys list so the panel renders the right branch on
          first paint. */}
      <CuePanel branches={cueBranches} dismissedKeys={cueDismissedKeys} />

      {/* 3.5 — Pending review prompts (V-2c Session 2 Stream A, mig 062).
          Only renders when the vendor has events past T+24h they haven't
          reviewed yet. */}
      {reviewPrompts.length > 0 && <ReviewPromptsCard prompts={reviewPrompts} />}

      {/* 4 — Active Inquiries / Bookings */}
      <section className={s.section}>
        <div className={s.sectionH}>
          <div className={s.sectionT}>Active</div>
          <a href="/vndr/inquiries" className={s.sectionA}>See all</a>
        </div>
        <div className={s.bookingList}>
          {activePipeline.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyStateIcon} aria-hidden="true">✦</div>
              <div className={s.emptyStateTitle}>Your pipeline is clear</div>
              <div className={s.emptyStateBody}>
                When new inquiries land or bookings approach their dates, the
                most urgent items surface here. Until then — make sure your
                profile is complete so Cue can match you confidently.
              </div>
            </div>
          ) : (
            activePipeline.map((row) => (
              <article
                key={`${row.kind}-${row.id}`}
                className={
                  row.kind === "inquiry" && row.badge === "urgent"
                    ? `${s.bk} ${s.bkUrgent}`
                    : s.bk
                }
              >
                <div className={s.bkRow}>
                  <div>
                    <div className={s.bkEvent}>{row.eventName}</div>
                    <div className={s.bkDetail}>
                      {row.kind === "inquiry"
                        ? `${row.guestCount || "?"} guests${
                            row.proposedPriceCents
                              ? ` · est. $${(row.proposedPriceCents / 100).toLocaleString()}`
                              : ""
                          }`
                        : `${row.guestCount || "?"} guests · $${(row.totalCents / 100).toLocaleString()} booked`}
                    </div>
                  </div>
                  <span className={`${s.bkBadge} ${badgeClass(row)}`}>
                    {badgeLabel(row)}
                  </span>
                </div>
                <div className={s.bkMeta}>
                  <span>{formatEventDate(row.eventDate)}</span>
                  {row.kind === "inquiry" ? (
                    <span>
                      {row.hoursRemaining > 0
                        ? `${row.hoursRemaining}h to respond`
                        : "Past deadline"}
                    </span>
                  ) : (
                    <span>
                      {row.daysUntilEvent > 0
                        ? `${row.daysUntilEvent} day${row.daysUntilEvent === 1 ? "" : "s"} out`
                        : "Today"}
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* 5 — Trust Score */}
      <div className={s.trustCard}>
        <div className={s.sectionH}>
          <div className={s.sectionT}>Trust Score</div>
        </div>
        <div className={s.trustScoreRow}>
          <div className={s.trustBig}>{heroMetrics.trustScore.total}</div>
          <div className={s.trustBadge}>{tierLabel(heroMetrics.trustScore.tier)}</div>
        </div>
        <div className={s.trustSub}>{trustSubCopy(heroMetrics.trustScore)}</div>
        <div className={s.trustBars}>
          <div className={s.tbRow}>
            <div className={s.tbLbl}>Reviews (40%)</div>
            <div className={s.tbTrack}>
              <div
                className={s.tbFill}
                style={{ width: `${heroMetrics.trustScore.subMetrics.reviewAverage}%` }}
              />
            </div>
            <div className={s.tbVal}>{heroMetrics.trustScore.subMetrics.reviewAverage}</div>
          </div>
          <div className={s.tbNext}>
            Reviews land with V-2c. Your score caps at 60 until then.
          </div>

          <div className={s.tbRow}>
            <div className={s.tbLbl}>Response rate (30%)</div>
            <div className={s.tbTrack}>
              <div
                className={s.tbFill}
                style={{ width: `${heroMetrics.trustScore.subMetrics.responseRate}%` }}
              />
            </div>
            <div className={s.tbVal}>{heroMetrics.trustScore.subMetrics.responseRate}</div>
          </div>
          {heroMetrics.trustScore.subMetrics.responseRate < 100 && (
            <div className={s.tbNext}>
              Respond to your next inquiry within 24h to lift this.
            </div>
          )}

          <div className={s.tbRow}>
            <div className={s.tbLbl}>Completion rate (20%)</div>
            <div className={s.tbTrack}>
              <div
                className={s.tbFill}
                style={{ width: `${heroMetrics.trustScore.subMetrics.completionRate}%` }}
              />
            </div>
            <div className={s.tbVal}>{heroMetrics.trustScore.subMetrics.completionRate}</div>
          </div>
          {heroMetrics.trustScore.subMetrics.completionRate < 100 && (
            <div className={s.tbNext}>
              Complete your next booking to lift this.
            </div>
          )}

          <div className={s.tbRow}>
            <div className={s.tbLbl}>Profile (10%)</div>
            <div className={s.tbTrack}>
              <div
                className={s.tbFill}
                style={{ width: `${heroMetrics.trustScore.subMetrics.profileCompleteness}%` }}
              />
            </div>
            <div className={s.tbVal}>{heroMetrics.trustScore.subMetrics.profileCompleteness}</div>
          </div>
          {heroMetrics.trustScore.profileMissingCount > 0 && (
            <div className={s.tbNext}>
              <a href="/vndr/profile" className={s.tbNextLink}>
                Fill {heroMetrics.trustScore.profileMissingCount} more profile
                field{heroMetrics.trustScore.profileMissingCount === 1 ? "" : "s"} →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 6 — Mini Calendar */}
      <MiniCalendar
        month={calendarMonth}
        blocks={blocks}
        defaultCommissionPct={defaultCommissionPct}
      />

      {/* 7 — Packages (V-2b smoke-fix G4/G5/G6: PackagesSection owns the
          EditPackageSheet open state for both add + edit flows). */}
      <PackagesSection packages={packages} />
    </>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function humanizeSlug(slug: string): string {
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function tierLabel(tier: "building" | "developing" | "strong" | "excellent"): string {
  switch (tier) {
    case "excellent":
      return "Excellent";
    case "strong":
      return "Strong";
    case "developing":
      return "Developing";
    case "building":
      return "Building";
  }
}

type ActiveRow = Awaited<ReturnType<typeof getVndrActivePipeline>>[number];

function badgeClass(row: ActiveRow): string {
  if (row.kind === "inquiry") {
    if (row.badge === "urgent") return s.bbUrg;
    return s.bbNew;
  }
  return s.bbConf;
}

function badgeLabel(row: ActiveRow): string {
  if (row.kind === "inquiry") {
    if (row.badge === "urgent") return "Urgent";
    if (row.badge === "reviewing") return "Reviewing";
    return "New";
  }
  if (row.badge === "upcoming") return "Upcoming";
  return "Confirmed";
}

function formatEventDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function trustSubCopy(score: {
  tier: "building" | "developing" | "strong" | "excellent";
  subMetrics: { responseRate: number; profileCompleteness: number };
}): string {
  if (score.tier === "excellent") return "Top-tier signal across response, completion, and reviews.";
  if (score.tier === "strong") return "Solid signal — keep responding promptly to lock in excellent.";
  if (score.tier === "developing") return "Building trust — every responded inquiry and completed booking moves the needle.";
  if (score.subMetrics.profileCompleteness < 75) {
    return "Profile completeness is the easiest first lift — fill it out to surface in more matches.";
  }
  return "New vendor — your score grows with each inquiry response and completed booking.";
}
