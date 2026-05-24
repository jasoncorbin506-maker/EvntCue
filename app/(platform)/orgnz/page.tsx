import Link from "next/link";
import { redirect } from "next/navigation";
import { CATEGORIES, type CategoryKey } from "@/data/budget-presets";
import {
  mergeRecipeWithCustoms,
  pickRecipe,
  type CustomMilestoneForMerge,
} from "@/data/run-of-show/dispatch";
import { CuePill } from "./_components/CuePill";
import { Feed, type FeedCard } from "./_components/Feed";
import { RunOfShow } from "./_components/RunOfShow";
import { Hero } from "./_components/Hero";
import { LockDateCta } from "./_components/LockDateCta";
import { SheetManager } from "./_components/SheetManager";
import { TileGrid } from "./_components/TileGrid";
import { TimelineRail } from "./_components/TimelineRail";
import { buildBenchmarkRows, overallVariance } from "./_lib/benchmarks";
import {
  daysUntil,
  loadOrgnzContext,
  prettyEventType,
} from "./_lib/load-context";
import { buildRailPins, formatStartLongDate } from "./_lib/timeline";
import { checkSubscription } from "@/lib/subscriptions/check";
import styles from "./orgnz.module.css";

export const metadata = { title: "Dashboard · EvntCue" };

const VALID_CATEGORIES: CategoryKey[] = ["wedding", "corporate", "nonprofit", "public", "social"];

function toCategory(eventType: string): CategoryKey {
  return (VALID_CATEGORIES as string[]).includes(eventType)
    ? (eventType as CategoryKey)
    : "social";
}

function buildWelcomeFeed(args: {
  eventType: string;
  daysOut: number;
  hasVenu: boolean;
}): FeedCard[] {
  const cards: FeedCard[] = [];

  cards.push({
    id: "welcome",
    kind: "cueSuggest",
    eyebrow: "Cue welcomes you",
    when: "Just now",
    body: `<em>Your celebration is on the board.</em> Three things up next: lock the venue, build a mood board, and tell us if you want a Plnr to ride alongside.`,
    primaryCta: {
      label: "Start mood board",
      toast: "Mood Board opens. <em>Pin your first image.</em>",
    },
    secondaryCta: {
      label: "Find a Plnr",
      toast: "Plnr sheet opens here in <em>3.2.B</em>.",
    },
  });

  if (!args.hasVenu) {
    cards.push({
      id: "venu-first",
      kind: "cueWarn",
      eyebrow: "Venu first",
      when: "Lock 5a",
      body: `Vendors get sticky once a date is locked, and a date locks when the <strong>venue</strong> confirms. <em>You can still proceed</em> — just expect quotes to firm up after.`,
      primaryCta: {
        label: "Browse Venu",
        toast: "Venu sheet opens here in <em>3.2.B</em>.",
      },
    });
  }

  if (args.daysOut <= 60 && args.daysOut > 0) {
    cards.push({
      id: "tight-window",
      kind: "cueWarn",
      eyebrow: "Tight window",
      when: `${args.daysOut} days out`,
      body: `Most ${args.eventType.toLowerCase()} vendors prefer 90+ days. <em>You can still proceed</em>, but expect rush fees on a few categories.`,
    });
  }

  return cards;
}

export default async function OrgnzDashboardPage() {
  const ctx = await loadOrgnzContext();
  if (!ctx) redirect("/login?role=orgnz");

  if (!ctx.event) {
    return (
      <div className={styles.pageBody}>
        <h1 className={styles.pageBodyTitle}>
          <em>Let&rsquo;s seed your event.</em>
        </h1>
        <p className={styles.pageBodyText}>
          You&rsquo;re signed in but no event is attached to this account yet —
          probably because you confirmed your email on a different device than
          you signed up from. Re-run the calculator and we&rsquo;ll attach it.
        </p>
        <Link href="/budget-calculator" className={styles.pageBodyLink}>
          Open the Budget Calculator →
        </Link>
      </div>
    );
  }

  const { event, lineItems, customMilestones } = ctx;
  const allocatedCents = lineItems.reduce((sum, item) => sum + item.amount_cents, 0);
  const days = daysUntil(event.start_date);
  const category = toCategory(event.event_type);
  const longDate = formatStartLongDate(event.start_date);

  // PARKING_LOT #10 closed 2026-05-11 (session 9) — migration 021 added
  // events.event_subtype. Pins now resolve to research-backed cultural lists
  // (Catholic pre-Cana, Hindu sangeet+mehndi+baraat, Jewish ketubah, etc.).
  // Falls through to the per-category generic fallback only when the column
  // is NULL (pre-3.2.C events or calculator bypass).
  //
  // PARKING_LOT #36 closed 2026-05-12 (session 12) — migration 024 added
  // events.milestone_overrides JSONB + event_custom_milestones table. Pins
  // now merge overrides (status / custom_date / custom_time / sort_order) +
  // user-authored custom milestones (from the cultural picker and free-text
  // adds) on top of the seed list.
  const overrides = (event.milestone_overrides as Record<string, Record<string, unknown>> | null) ?? {};
  const pins = buildRailPins({
    category,
    subtypeKey: event.event_subtype,
    startDateIso: event.start_date,
    overrides: overrides as Record<string, {
      status?: "done" | "dismissed";
      custom_date_iso?: string;
      custom_time?: string;
      sort_order?: number;
    }>,
    customMilestones,
  });

  const dismissedSeedKeys = Object.entries(overrides)
    .filter(([, v]) => (v as { status?: string })?.status === "dismissed")
    .map(([k]) => k);

  // Lock 3 closure (2026-05-16, session 15) — real subscription check.
  // RLS-scoped read against the subscriptions table (migration 026). Returns
  // 'orgnz_paid' when an active orgnz_19_99 row matches ctx.user. Stripe webhook
  // writes land in Phase 4; until then, dev rows are inserted manually.
  // PARKING_LOT #34 closed.
  const tier = await checkSubscription(ctx.user.id, ctx.tenantId);
  const isPaidTier = tier === "orgnz_paid";

  // No live data for these yet — placeholders until Phase 4+/5+ wires them.
  const vendorCount = 0;
  const moodImageCount = 0;
  const guestRsvpIn: number | null = null;
  const hasPlnr = false;
  const hasVenu = false;

  const welcomeCards = buildWelcomeFeed({
    eventType: prettyEventType(event.event_type),
    daysOut: days,
    hasVenu,
  });

  // Cue Pricing Informatics — DFW benchmarks reused from budget-presets per Jason 2026-05-10.
  // Proper percentile extraction from 03_Research/ xlsx queued in PARKING_LOT #20.
  const guestCountForBench = event.guest_count ?? CATEGORIES.find((c) => c.key === category)?.typicalGuests ?? 150;
  const benchmarks = buildBenchmarkRows({
    category,
    guestCount: guestCountForBench,
    userLineItems: lineItems.map((li) => ({ label: li.label, amount_cents: li.amount_cents })),
    topN: 5,
  });
  const { pct: variancePct, state: varianceState } = overallVariance(benchmarks);
  const categoryLabel = CATEGORIES.find((c) => c.key === category)?.label.toLowerCase() ?? "event";

  // Run of Show — Scope B hallway (2026-05-24). Pick the recipe by event
  // type + subtype (universal fallback if no match), merge in any custom
  // milestones tagged with a ros_phase, render in phase order.
  const rosRecipe = pickRecipe(event.event_type, event.event_subtype);
  const customsForRos: CustomMilestoneForMerge[] = customMilestones.map(
    (m) => ({
      id: m.id,
      label: m.label,
      custom_time: m.custom_time,
      ros_phase: m.ros_phase ?? null,
      vendor_name: m.vendor_name ?? null,
    }),
  );
  const rosByPhase = mergeRecipeWithCustoms(rosRecipe, customsForRos);

  const budgetSheetData = {
    spentCents: allocatedCents,
    budgetCents: event.budget_cents ?? 0,
    // Real escrow / paid-out flows land Phase 4 (Stripe Connect). Stub at zero so the
    // hero card renders honestly until then.
    escrowCents: 0,
    paidOutCents: 0,
    guestCount: guestCountForBench,
    categoryLabel,
    benchmarks,
    benchmarkSummaryPct: variancePct,
    benchmarkSummaryState: varianceState,
    lineItems: lineItems.map((li) => ({ label: li.label, amount_cents: li.amount_cents })),
  };

  return (
    <>
      <CuePill />
      <Hero
        eventName={event.name}
        longDate={longDate}
        daysOut={days}
        guestCount={event.guest_count}
        eventId={event.id}
        timing={{
          start_date: event.start_date,
          start_time: event.start_time,
          timezone: event.timezone,
          date_status: event.date_status,
          duration_minutes: event.duration_minutes,
        }}
      />
      <LockDateCta
        eventId={event.id}
        currentTiming={{
          start_date: event.start_date,
          start_time: event.start_time,
          timezone: event.timezone,
          date_status: event.date_status,
          duration_minutes: event.duration_minutes,
        }}
      />
      <TimelineRail
        pins={pins}
        eventId={event.id}
        startDateIso={event.start_date}
        subtypeKey={event.event_subtype}
        dismissedSeedKeys={dismissedSeedKeys}
      />
      <Feed initial={welcomeCards} />
      <TileGrid
        budgetCents={event.budget_cents}
        allocatedCents={allocatedCents}
        vendorCount={vendorCount}
        moodImageCount={moodImageCount}
        guestRsvpIn={guestRsvpIn}
        guestTotal={event.guest_count}
        hasPlnr={hasPlnr}
        hasVenu={hasVenu}
        isPaidTier={isPaidTier}
      />
      <RunOfShow
        headlineDate={longDate}
        recipeLabel={rosRecipe.labelEn}
        byPhase={rosByPhase}
      />
      <SheetManager budget={budgetSheetData} hasVenu={hasVenu} />
    </>
  );
}
