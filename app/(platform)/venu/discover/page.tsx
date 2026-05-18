import Link from "next/link";
import { Chrome, LivePill } from "../_components/Chrome";
import s from "../venu.module.css";

/**
 * Venu Discover tab — primary landing for the portal.
 *
 * Per Venu_Locked_2026-05-13.md §"Nav structure (five tabs)" row 1, Discover
 * holds: welcome strip · readiness ring · stat row · action tiles ·
 * Atmosphere Board · Cue line.
 *
 * Stub data throughout — chunk A is the shell + visual surface. Real reads
 * (venue name from `venues`, ring/stats from inquiries+bookings, board from
 * mood_boards) wire in chunks B+C as those tables get queried by the
 * surrounding tabs.
 *
 * Open design items (PARKING_LOT #45) shipped at their default:
 * - Welcome strip dismissibility → persistent (default per v5 mockup).
 * - Match score 87 → illustrative, no formula yet.
 * - Per-space detail view → tile exits stub-routed.
 */
export default async function VenuDiscover({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const venueName = "The Lantern Hall";
  const isLive = false;
  const isFirstTimeClaim = welcome === "claim";

  return (
    <>
      <Chrome
        venueName={venueName}
        roleLabel="Discover"
        right={isLive ? <LivePill /> : null}
      />

      <section className={s.welcomeStrip}>
        {isFirstTimeClaim ? (
          <>
            <div className={s.welcomeEyebrow}>You&apos;re in</div>
            <div className={s.welcomeHeadline}>
              Welcome to EvntCue, <i>{venueName}</i>.
            </div>
            <p className={s.welcomeBody}>
              Your dashboard is live. Take a look around — inquiries, bookings, and
              tools are ready when you are.
            </p>
          </>
        ) : (
          <>
            <div className={s.welcomeEyebrow}>Welcome back</div>
            <div className={s.welcomeHeadline}>You&apos;re ready for the week.</div>
            <p className={s.welcomeBody}>
              Two new inquiries are waiting. Saturday&apos;s booking goes live in 4 days.
            </p>
          </>
        )}
      </section>

      <section className={s.statBlock}>
        <div className={s.ring} aria-label="87% match score">
          <span className={s.ringNum}>87</span>
        </div>
        <div className={s.statRow}>
          <div className={s.statTitle}>Match score</div>
          <div className={s.statBody}>
            Your space pairs well with inquiries this week — pricing, dates, and capacity all align.
          </div>
          <div className={s.statMeta}>Updated just now</div>
        </div>
      </section>

      <section className={s.tileGrid}>
        <Link href="/venu/inquiries" className={s.tile}>
          <div className={s.tileIco}>
            <svg viewBox="0 0 24 24">
              <path d="M4 7h16v12H4z" />
              <path d="M4 7l8 6 8-6" />
            </svg>
          </div>
          <div className={s.tileLabel}>2 new inquiries</div>
          <div className={s.tileSub}>Reply within 24h to keep SLA green.</div>
        </Link>

        <Link href="/venu/bookings" className={s.tile}>
          <div className={s.tileIco}>
            <svg viewBox="0 0 24 24">
              <rect x="4" y="5" width="16" height="16" rx="2" />
              <path d="M4 9h16M9 3v4M15 3v4" />
            </svg>
          </div>
          <div className={s.tileLabel}>4 bookings this month</div>
          <div className={s.tileSub}>Next: Hartwell wedding · Saturday.</div>
        </Link>

        <Link href="/venu/tools" className={s.tile}>
          <div className={s.tileIco}>
            <svg viewBox="0 0 24 24">
              <path d="M14.7 6.3a4.5 4.5 0 0 1 6.4 6.3l-9.6 9.6a2.5 2.5 0 0 1-3.5-3.5L17 9.7M3 13l4 4M9 7l3 3" />
            </svg>
          </div>
          <div className={s.tileLabel}>Tools</div>
          <div className={s.tileSub}>Atmosphere, spaces, preferred vendors.</div>
        </Link>

        <Link href="/venu/money" className={s.tile}>
          <div className={s.tileIco}>
            <svg viewBox="0 0 24 24">
              <path d="M12 4v16M7 8h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" />
            </svg>
          </div>
          {/* Lock 14b register — professional financial language. Chunk C carries the same
              terminology into the Money tab's hero (was "take-home" in the mockup; "Revenue"
              + "Net revenue" for the post-fee figure). */}
          <div className={s.tileLabel}>Revenue this month</div>
          <div className={s.tileSub}>Breakdown by event, fees, and payouts.</div>
        </Link>
      </section>

      <section className={s.boardStrip}>
        <div className={s.sectionH}>
          <h2 className={s.sectionT}>Atmosphere Board</h2>
          <Link href="/venu/tools" className={s.sectionA}>
            Edit →
          </Link>
        </div>
        <Link href="/venu/tools" className={s.boardStripBody}>
          <div className={s.boardThumbs}>
            <div className={s.boardThumb} />
            <div className={s.boardThumb} />
            <div className={s.boardThumb} />
            <div className={s.boardThumb} />
          </div>
          <div className={s.boardBody}>
            <div className={s.boardName}>Lantern Hall · Winter palette</div>
            <div className={s.boardMeta}>12 owned images · last updated 3 days ago</div>
          </div>
        </Link>
      </section>

      <p className={s.cueLine}>Your space, your way. We just bring the bookings.</p>
    </>
  );
}
