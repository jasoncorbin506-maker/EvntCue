import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import styles from "../orgnz.module.css";

export const metadata = { title: "Mood Board · EvntCue" };

export default async function MoodBoardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?role=orgnz&intent=mood_board");

  // Detect whether the funnel actually seeded an event for this user. If
  // the cookies were on a different device when the email-confirm link
  // was opened, postAuthSeed will have created the tenant but not an
  // event — surface a clear "pick up where you left off" path instead of
  // claiming the draft is here when it isn't.
  const admin = createAdminClient();
  const { data: roles } = await admin
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "orgnz")
    .limit(1);
  const tenantId = roles?.[0]?.tenant_id as string | undefined;

  let hasEvent = false;
  if (tenantId) {
    const { count } = await admin
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("orgnz_tenant_id", tenantId);
    hasEvent = (count ?? 0) > 0;
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Mood Board</p>
          <h1 className={styles.title}>
            <em>
              {hasEvent
                ? "Your visual brief — coming up next."
                : "Let’s pick up where you left off."}
            </em>
          </h1>
          <p className={styles.sub}>
            {hasEvent
              ? "The Path 1 Curator (real photos, owned-only, color-thief palette extraction) lands in Phase 3.2. Your event is already saved — when this page goes live, your draft will be here waiting."
              : "Looks like you confirmed your email on a different device than you signed up from, so your budget didn’t carry over. Re-run the calculator and we’ll attach it to your account."}
          </p>
        </header>

        <section className={styles.cardEmpty}>
          {hasEvent ? (
            <p>
              Want to revisit your budget?{" "}
              <Link href="/orgnz" className={styles.link}>
                Back to overview
              </Link>
              .
            </p>
          ) : (
            <p>
              <Link href="/budget-calculator" className={styles.link}>
                Open the Budget Calculator →
              </Link>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
