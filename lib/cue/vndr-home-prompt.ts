import "server-only";
import type { HeroMetrics } from "@/lib/vndr/hero-metrics";
import type { OldestUnrespondedInquiry } from "@/lib/vndr/oldest-unresponded-inquiry";

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
 * Ladder (first match wins):
 *   1. Unresponded inquiries → urgency surface
 *   2. Trust score dropped recently (not implemented V-2b — needs snapshot
 *      history; placeholder)
 *   3. Low profile completeness → growth surface
 *   4. Strong metrics → reinforcement surface
 *   5. Brand-new vendor → onboarding-progress surface
 */

export type CueGuidance = {
  text: string;
  action?: {
    label: string;
    href: string;
  };
};

export function assembleVndrHomeCue(args: {
  metrics: HeroMetrics;
  oldestUnresponded: OldestUnrespondedInquiry | null;
  vendorDisplayName: string;
}): CueGuidance {
  const { metrics, oldestUnresponded } = args;
  const { trustScore } = metrics;

  if (oldestUnresponded) {
    const hoursLeft = Math.max(
      0,
      (oldestUnresponded.deadlineMs - Date.now()) / (1000 * 60 * 60),
    );
    if (oldestUnresponded.isOverdue) {
      return {
        text: `${oldestUnresponded.eventName} is past its response window. Responding now still puts you in front of the planner — silent inquiries quietly route to the next vendor.`,
        action: { label: "View inquiry", href: "/vndr/inquiries" },
      };
    }
    if (hoursLeft < 4) {
      return {
        text: `${oldestUnresponded.eventName} is inside its last response window. A reply in the next hour keeps your conversion rate where it is.`,
        action: { label: "Respond now", href: "/vndr/inquiries" },
      };
    }
    return {
      text: `You have an open inquiry from ${oldestUnresponded.eventName}. Responding within 24h boosts conversion by ~40% on similar vendors.`,
      action: { label: "View inquiry", href: "/vndr/inquiries" },
    };
  }

  if (trustScore.subMetrics.profileCompleteness < 75) {
    return {
      text: `Your profile reads ${trustScore.subMetrics.profileCompleteness}% complete. Vendors with full profiles surface higher in Cue's matches — even one more photo helps.`,
      action: { label: "Edit profile", href: "/vndr/profile" },
    };
  }

  if (metrics.conversionRatePct >= 50 && trustScore.tier !== "building") {
    return {
      text: `Your conversion is at ${metrics.conversionRatePct}% — that's above the platform median. Keep responding promptly and the calendar fills itself.`,
    };
  }

  if (metrics.bookingsThisMonth === 0 && metrics.conversionRatePct === 0) {
    return {
      text: "You're set up but the calendar's quiet. Cue surfaces vendors when planners search — the more complete your profile, the faster the first match.",
      action: { label: "Edit profile", href: "/vndr/profile" },
    };
  }

  return {
    text: "Nothing urgent today. The dashboard updates the moment a new inquiry lands.",
  };
}
