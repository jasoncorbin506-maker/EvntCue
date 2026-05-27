import Link from "next/link";
import s from "./CalendarAttestationCard.module.css";

/**
 * Soft-nudge card surfaced on /venu/discover home when the venue hasn't
 * attached a calendar by any signal (no feeds, no imported blocks, no
 * attestation row). Per Lock 22 forgiveness pattern — informs the operator
 * about the gap to Discover, does not block any other portal action.
 *
 * Tap routes to /venu/availability where the operator can:
 *   - subscribe a calendar (Session B)
 *   - upload a CSV (Session B)
 *   - confirm "no existing reservations" (Session A — ships today)
 */
export function CalendarAttestationCard() {
  return (
    <Link href="/venu/availability" className={s.card}>
      <div className={s.eyebrow}>To appear in Discover</div>
      <div className={s.title}>Connect your calendar</div>
      <div className={s.body}>
        Organizers see your real availability once you tell us when
        you&apos;re booked. Takes a minute.
      </div>
      <div className={s.cta}>Set up availability →</div>
    </Link>
  );
}
