import Link from "next/link";
import { redirect } from "next/navigation";
import { BudgetCard } from "./_components/BudgetCard";
import { ChecklistCard } from "./_components/ChecklistCard";
import { CuePanel } from "./_components/CuePanel";
import { MessagesCard } from "./_components/MessagesCard";
import { MilestoneTimeline } from "./_components/MilestoneTimeline";
import { MoodBoardHero } from "./_components/MoodBoardHero";
import { StatsGrid } from "./_components/StatsGrid";
import { VendorGrid } from "./_components/VendorGrid";
import { daysUntil, loadOrgnzContext } from "./_lib/load-context";
import shell from "./orgnz.module.css";
import styles from "./dashboard.module.css";
import type { CategoryKey } from "@/data/budget-presets";

export const metadata = { title: "Dashboard · EvntCue" };

// event_type enum on the events table is wider than CategoryKey (the
// 5 calculator categories). Anything outside the 5 falls back to "social"
// for milestone lookups.
function toCategory(eventType: string): CategoryKey {
  const valid: CategoryKey[] = ["wedding", "corporate", "nonprofit", "public", "social"];
  return (valid as string[]).includes(eventType)
    ? (eventType as CategoryKey)
    : "social";
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

  const { event, lineItems } = ctx;
  const allocated = lineItems.reduce((sum, item) => sum + item.amount_cents, 0);
  const days = daysUntil(event.start_date);
  const category = toCategory(event.event_type);

  return (
    <>
      <MoodBoardHero imageCount={0} paletteHex={[]} vibeLabel={null} />

      <CuePanel eventType={event.event_type} daysOut={days} />

      <StatsGrid
        budgetCents={event.budget_cents}
        allocatedCents={allocated}
        lineItemCount={lineItems.length}
        guestCount={event.guest_count}
      />

      <div className={styles.twoCol}>
        <div>
          <div className={shell.secH}>
            <div className={shell.secT}>Vendor status</div>
            <span className={shell.secA}>Browse marketplace — soon</span>
          </div>
          <VendorGrid />

          <div className={shell.secH}>
            <div className={shell.secT}>Budget</div>
            <span className={shell.secA}>Details — soon</span>
          </div>
          <BudgetCard
            budgetCents={event.budget_cents}
            contingencyPct={event.contingency_pct}
            lineItems={lineItems}
          />

          <div className={shell.secH}>
            <div className={shell.secT}>Upcoming milestones</div>
            <span className={shell.secA}>Full timeline — soon</span>
          </div>
          <MilestoneTimeline category={category} startDateIso={event.start_date} />
        </div>

        <div>
          <div className={shell.secH}>
            <div className={shell.secT}>This week</div>
            <span className={shell.secA}>All tasks — soon</span>
          </div>
          <ChecklistCard />

          <div className={shell.secH}>
            <div className={shell.secT}>Messages</div>
            <span className={shell.secA}>Inbox — soon</span>
          </div>
          <MessagesCard />
        </div>
      </div>
    </>
  );
}
