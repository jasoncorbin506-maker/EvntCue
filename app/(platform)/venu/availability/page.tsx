import { redirect } from "next/navigation";
import { Chrome } from "../_components/Chrome";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import {
  getVenueAvailabilityBlocks,
  getCalendarAttestation,
  hasVenueAttachedCalendar,
} from "@/lib/venu/availability";
import { getVenueSpaces } from "@/lib/venu/venue-spaces";
import { getCalendarFeeds } from "@/lib/venu/calendar-feeds";
import { AddBlockButton } from "./_components/AddBlockButton";
import { BlockRow } from "./_components/BlockRow";
import { AttestButton } from "./_components/AttestButton";
import { ConnectedCalendarsSection } from "./_components/ConnectedCalendarsSection";
import s from "./availability.module.css";

/**
 * Venu Availability page — Session A scope (venue-calendar arc).
 *
 * Surfaces:
 *   1. Onboarding-gate attestation card — only when the venue has not yet
 *      attached a calendar by ANY signal (no feeds, no imported blocks, no
 *      attestation row). Confirms "no existing reservations elsewhere" to
 *      satisfy Discover gating without a real import.
 *   2. Manual blocks — list of source='manual' rows grouped by year-month,
 *      with an Add-Block sheet trigger.
 *
 * Out of scope for Session A (lands in Session B):
 *   - Connected calendars (iCal subscription UI + polling worker)
 *   - CSV upload wizard
 *
 * Surface placement: navigated to from /venu/bookings via a "Set availability"
 * button in the Chrome right slot per Jason 2026-05-27 BottomNav pick
 * (keeps nav at 5 tabs).
 */

type Group = {
  ymKey: string; // YYYY-MM
  label: string;
  rows: Awaited<ReturnType<typeof getVenueAvailabilityBlocks>>;
};

function groupByMonth(
  blocks: Awaited<ReturnType<typeof getVenueAvailabilityBlocks>>,
): Group[] {
  const map = new Map<string, Group["rows"]>();
  for (const b of blocks) {
    const ym = b.blockedDate.slice(0, 7);
    const arr = map.get(ym) ?? [];
    arr.push(b);
    map.set(ym, arr);
  }
  const monthFmt = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, rows]) => {
      const [y, m] = ym.split("-").map(Number);
      const label = monthFmt.format(new Date(Date.UTC(y, m - 1, 1)));
      return { ymKey: ym, label, rows };
    });
}

export default async function VenuAvailability() {
  const venue = await getCurrentVenue();
  if (!venue) redirect("/venues");

  const [blocks, spaces, attestation, attached, feeds] = await Promise.all([
    getVenueAvailabilityBlocks(venue.tenantId),
    getVenueSpaces(venue.tenantId),
    getCalendarAttestation(venue.tenantId),
    hasVenueAttachedCalendar(venue.tenantId),
    getCalendarFeeds(venue.tenantId),
  ]);

  const manualBlocks = blocks.filter((b) => b.source === "manual");
  const groups = groupByMonth(manualBlocks);
  const showAttestation = !attached && !attestation;

  const spaceNameById = new Map(spaces.map((sp) => [sp.id, sp.name]));

  return (
    <>
      <Chrome
        venueName={venue.displayName}
        roleLabel="Availability"
        backHref="/venu/bookings"
      />

      {showAttestation && (
        <section className={s.attestSection}>
          <div className={s.attestEyebrow}>Get listed in Discover</div>
          <div className={s.attestTitle}>Connect your calendar</div>
          <p className={s.attestBody}>
            Organizers will see your real availability once you tell us when
            you&apos;re booked. Subscribe a calendar or upload a CSV when those
            tools ship — or, if you have no existing reservations elsewhere,
            confirm below to get listed today.
          </p>
          <AttestButton />
          <div className={s.attestFootnote}>
            You can always change this later by subscribing a calendar.
          </div>
        </section>
      )}

      <ConnectedCalendarsSection feeds={feeds} spaces={spaces} />

      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Manual blocks</h2>
          <AddBlockButton spaces={spaces} />
        </div>
        <p className={s.sectionHint}>
          Block dates you&apos;re unavailable — renovations, owner blackouts,
          private events. Organizers won&apos;t see your space on these days.
        </p>

        {groups.length === 0 ? (
          <div className={s.emptyState}>
            No blocks yet. Tap <b>Add block</b> to keep a date off the calendar.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.ymKey} className={s.monthBlock}>
              <div className={s.monthLabel}>{group.label}</div>
              <div className={s.blockList}>
                {group.rows.map((b) => (
                  <BlockRow
                    key={b.id}
                    id={b.id}
                    blockedDate={b.blockedDate}
                    startTime={b.startTime}
                    endTime={b.endTime}
                    reason={b.reason}
                    spaceName={
                      b.venueSpaceId
                        ? (spaceNameById.get(b.venueSpaceId) ?? "Unknown space")
                        : null
                    }
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
