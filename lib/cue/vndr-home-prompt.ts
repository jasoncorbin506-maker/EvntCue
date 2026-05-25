import "server-only";
import type { HeroMetrics } from "@/lib/vndr/hero-metrics";
import type { OldestUnrespondedInquiry } from "@/lib/vndr/oldest-unresponded-inquiry";
import type { CurrentVendor } from "@/lib/vndr/current-vendor";

/**
 * Vendor Home Cue Panel prompt assembly (V-2b §3). Composes a 1–2 sentence
 * piece of Cue-formatted guidance from vendor state. V-2b ships the
 * deterministic guidance ladder below; the real Cue SDK call (per Lock 8
 * voice contract) lands when CueService.ts wires up in Phase 3.4+.
 *
 * Voice — per Lock 8: warm, specific, present-tense, never punishing.
 * "You have N unresponded inquiries" not "You are letting inquiries lapse."
 * "Adding photos boosts X" not "Your profile is incomplete."
 *
 * ─── Return shape change (session 24, profile-completeness-one-time-cue brief) ───
 *
 * `assembleVndrHomeCue` now returns an ARRAY of branches in ladder-priority
 * order. The client-side CuePanel component picks the first branch whose
 * `key` isn't in the user's dismissed set (sessionStorage for now;
 * vendor_cue_dismissals table when V-2c-Phase-4-free Session 3 ships).
 * Falling back to "nothing to show" when every branch is dismissed.
 *
 * Each branch carries a stable `key` for dismiss tracking.
 *
 * Ladder (first match wins; client may skip a dismissed branch + try next):
 *   1. urgent_response_window     — unresponded inquiry inside last 4h
 *   2. overdue_response           — unresponded inquiry past deadline
 *   3. open_inquiry               — unresponded inquiry, plenty of time
 *   4. low_profile                — profile completeness < 75% (growth nudge)
 *   5. profile_completeness_expanded — completeness 75–99% on a vendor who
 *                                   completed legacy 4-field onboarding
 *                                   (regression-aware framing for the
 *                                   2db46d9 deploy that expanded the check
 *                                   from 4 → 12 fields)
 *   6. strong_metrics             — high conversion + non-building tier
 *   7. quiet_calendar             — brand-new vendor with no traffic
 *   8. quiet_day                  — fallback: nothing urgent
 */

export type CueLadderBranch = {
  /**
   * Stable key for dismiss tracking. Adding a new branch? Pick a key that
   * stays meaningful even if the copy evolves — the key persists in the
   * client's sessionStorage / future vendor_cue_dismissals row.
   */
  key: string;
  text: string;
  action?: {
    label: string;
    href: string;
  };
};

export type CueGuidance = {
  text: string;
  action?: {
    label: string;
    href: string;
  };
};

/**
 * Did this vendor complete the LEGACY 4-field profile check (the version
 * computeProfileCompleteness used before session 22 expanded it to 12)?
 * Used by the profile_completeness_expanded ladder branch to scope the
 * regression-aware Cue copy to vendors who actually experienced the drop.
 *
 * A vendor with ALL 4 legacy fields filled is one who finished onboarding
 * to the pre-session-22 standard — exactly the cohort that would have
 * scored 100% under the old check and now scores lower under the new one.
 */
function hasLegacyFourFieldData(vendor: CurrentVendor): boolean {
  return (
    !!vendor.displayName?.trim() &&
    !!vendor.primaryCategory &&
    !!vendor.primarySubType &&
    vendor.primarySubTypes.length > 0
  );
}

export function assembleVndrHomeCue(args: {
  metrics: HeroMetrics;
  oldestUnresponded: OldestUnrespondedInquiry | null;
  vendor: CurrentVendor;
}): CueLadderBranch[] {
  const { metrics, oldestUnresponded, vendor } = args;
  const { trustScore } = metrics;
  const branches: CueLadderBranch[] = [];

  // 1–3 — unresponded-inquiry branches (priority over everything else;
  // an urgent inquiry deserves the screen).
  if (oldestUnresponded) {
    const hoursLeft = Math.max(
      0,
      (oldestUnresponded.deadlineMs - Date.now()) / (1000 * 60 * 60),
    );
    if (oldestUnresponded.isOverdue) {
      branches.push({
        key: "overdue_response",
        text: `${oldestUnresponded.eventName} is past its response window. Responding now still puts you in front of the planner — silent inquiries quietly route to the next vendor.`,
        action: { label: "View inquiry", href: "/vndr/inquiries" },
      });
    } else if (hoursLeft < 4) {
      branches.push({
        key: "urgent_response_window",
        text: `${oldestUnresponded.eventName} is inside its last response window. A reply in the next hour keeps your conversion rate where it is.`,
        action: { label: "Respond now", href: "/vndr/inquiries" },
      });
    } else {
      branches.push({
        key: "open_inquiry",
        text: `You have an open inquiry from ${oldestUnresponded.eventName}. Responding within 24h boosts conversion by ~40% on similar vendors.`,
        action: { label: "View inquiry", href: "/vndr/inquiries" },
      });
    }
  }

  // 4 — low profile completeness (growth nudge; existing copy).
  if (trustScore.subMetrics.profileCompleteness < 75) {
    branches.push({
      key: "low_profile",
      text: `Your profile reads ${trustScore.subMetrics.profileCompleteness}% complete. Vendors with full profiles surface higher in Cue's matches — even one more photo helps.`,
      action: { label: "Edit profile", href: "/vndr/profile" },
    });
  }

  // 5 — profile_completeness_expanded — regression-aware Cue per Cowork's
  // 2026-05-25 brief. Fires when vendor completed legacy 4-field
  // onboarding but their 12-field score is 75–99% (the band the
  // low_profile branch doesn't cover). New onboarded vendors at 100%
  // skip this branch; brand-new vendors below 75% hit low_profile first.
  if (
    trustScore.subMetrics.profileCompleteness < 100 &&
    trustScore.subMetrics.profileCompleteness >= 75 &&
    hasLegacyFourFieldData(vendor)
  ) {
    const missing = trustScore.profileMissingCount;
    branches.push({
      key: "profile_completeness_expanded",
      text:
        missing === 1
          ? "Heads up: we expanded what counts toward your trust score. Your profile is 1 field away from full — Profile tab shows what's new."
          : `Heads up: we expanded what counts toward your trust score. Your profile is ${missing} fields away from full — Profile tab shows what's new.`,
      action: { label: "Open Profile", href: "/vndr/profile" },
    });
  }

  // 6 — strong reinforcement.
  if (metrics.conversionRatePct >= 50 && trustScore.tier !== "building") {
    branches.push({
      key: "strong_metrics",
      text: `Your conversion is at ${metrics.conversionRatePct}% — that's above the platform median. Keep responding promptly and the calendar fills itself.`,
    });
  }

  // 7 — quiet calendar (brand-new vendor with no traffic).
  if (metrics.bookingsThisMonth === 0 && metrics.conversionRatePct === 0) {
    branches.push({
      key: "quiet_calendar",
      text: "You're set up but the calendar's quiet. Cue surfaces vendors when planners search — the more complete your profile, the faster the first match.",
      action: { label: "Edit profile", href: "/vndr/profile" },
    });
  }

  // 8 — fallback. Always last; always present so the panel never returns
  // an empty array (which would still render nothing client-side after
  // every other branch dismissed, but the fallback gives the panel a
  // reason to exist for vendors in a healthy quiet state).
  branches.push({
    key: "quiet_day",
    text: "Nothing urgent today. The dashboard updates the moment a new inquiry lands.",
  });

  return branches;
}
