import Link from "next/link";
import { redirect } from "next/navigation";
import { loadOrgnzContext } from "../_lib/load-context";
import styles from "../orgnz.module.css";

export const metadata = { title: "Mood Board · EvntCue" };

export default async function MoodBoardPage() {
  const ctx = await loadOrgnzContext();
  if (!ctx) redirect("/login?role=orgnz&intent=mood_board");

  const hasEvent = ctx.event != null;

  return (
    <div className={styles.pageBody}>
      <h1 className={styles.pageBodyTitle}>
        <em>
          {hasEvent
            ? "Your visual brief — coming up next."
            : "Let&rsquo;s pick up where you left off."}
        </em>
      </h1>
      <p className={styles.pageBodyText}>
        {hasEvent
          ? "The Curator (URL paste, file upload, color-thief palette extraction) is the next CC chunk after the dashboard sheets land. Your event is already saved — when this page goes live, your draft will be here waiting."
          : "Looks like you confirmed your email on a different device than you signed up from, so your budget didn’t carry over. Re-run the calculator and we’ll attach it to your account."}
      </p>
      <p>
        {hasEvent ? (
          <Link href="/orgnz" className={styles.pageBodyLink}>
            Back to dashboard →
          </Link>
        ) : (
          <Link href="/budget-calculator" className={styles.pageBodyLink}>
            Open the Budget Calculator →
          </Link>
        )}
      </p>
    </div>
  );
}
