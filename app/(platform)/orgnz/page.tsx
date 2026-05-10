import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOutAction } from "./_actions/sign-out";
import styles from "./orgnz.module.css";

export const metadata = { title: "Your event · EvntCue" };

export default async function OrgnzOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?role=orgnz");

  const admin = createAdminClient();

  const { data: roles } = await admin
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "orgnz")
    .limit(1);
  const tenantId = roles?.[0]?.tenant_id as string | undefined;

  let event:
    | {
        id: string;
        name: string;
        event_type: string;
        start_date: string;
        guest_count: number | null;
        budget_cents: number | null;
      }
    | null = null;
  let lineCount = 0;

  if (tenantId) {
    const { data: events } = await admin
      .from("events")
      .select("id,name,event_type,start_date,guest_count,budget_cents")
      .eq("orgnz_tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1);
    event = events?.[0] ?? null;
    if (event) {
      const { count } = await admin
        .from("event_budgets")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id);
      lineCount = count ?? 0;
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.head}>
          <div className={styles.headRow}>
            <p className={styles.eyebrow}>Orgnz portal</p>
            <form action={signOutAction}>
              <button type="submit" className={styles.signOut}>
                Sign out
              </button>
            </form>
          </div>
          <h1 className={styles.title}>
            <em>Welcome to your workspace.</em>
          </h1>
          <p className={styles.sub}>
            Phase 3.2 — full portal surfaces — lands next. For now, here&rsquo;s what
            we captured for you.
          </p>
        </header>

        {event ? (
          <section className={styles.card}>
            <p className={styles.cardEyebrow}>Your draft event</p>
            <h2 className={styles.cardTitle}>{event.name}</h2>
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt>Type</dt>
                <dd>{event.event_type}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Date</dt>
                <dd>{event.start_date}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Guests</dt>
                <dd>{event.guest_count ?? "—"}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Budget</dt>
                <dd>
                  {event.budget_cents != null
                    ? `$${(event.budget_cents / 100).toLocaleString()}`
                    : "—"}
                </dd>
              </div>
              <div className={styles.fact}>
                <dt>Line items</dt>
                <dd>{lineCount}</dd>
              </div>
            </dl>
          </section>
        ) : (
          <section className={styles.cardEmpty}>
            <p>
              No draft yet. Run the{" "}
              <Link href="/budget-calculator" className={styles.link}>
                Budget Calculator
              </Link>{" "}
              to seed your first event.
            </p>
          </section>
        )}

        <nav className={styles.nav}>
          <Link href="/orgnz/mood-board" className={styles.navLink}>
            Mood Board →
          </Link>
        </nav>
      </div>
    </main>
  );
}
