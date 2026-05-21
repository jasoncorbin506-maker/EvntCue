import { redirect } from "next/navigation";
import { Chrome } from "../_components/Chrome";
import { BookingRow } from "../_components/BookingRow";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import { getVenueBookings, groupVenuBookings } from "@/lib/venu/bookings";
import s from "../venu.module.css";

/**
 * Venu Bookings tab — Today / This week / Rest of month vertical scroll
 * groups per Venu_Locked_2026-05-13.md row 3. No calendar grid on mobile.
 *
 * Wire-DB: reads `bookings` joined to `events` filtered by current venue's
 * tenant (RLS-scoped). Empty groups render their header + a one-line empty
 * hint; non-empty groups render the BookingRow list. Tapping any row drills
 * into `/venu/bookings/[event_id]` per the spine principle.
 */
export default async function VenuBookings() {
  const venue = await getCurrentVenue();
  if (!venue) redirect("/venues");

  // For v1, spaceLabel falls back to the venue display name. Per-space
  // granularity (the open Venu-lock item #45) lands when venue_spaces wires.
  const bookings = await getVenueBookings(venue.tenantId, venue.displayName);
  const groups = groupVenuBookings(bookings, new Date());

  return (
    <>
      <Chrome venueName={venue.displayName} roleLabel="Bookings" backHref="/venu/discover" />
      {groups.map((group) => (
        <section key={group.key} className={s.section}>
          <div className={s.sectionH}>
            <h2 className={s.sectionT}>{group.label}</h2>
            {group.rows.length > 0 && (
              <span className={s.sectionA}>{group.rows.length}</span>
            )}
          </div>
          {group.rows.length === 0 ? (
            <div className={s.emptyStateInline}>
              {group.key === "today" ? "Nothing scheduled today."
                : group.key === "thisWeek" ? "Nothing this week."
                : group.key === "restOfMonth" ? "Nothing else this month."
                : "No bookings beyond this month yet."}
            </div>
          ) : (
            <div className={s.bookingList}>
              {group.rows.map((b) => (
                <BookingRow key={b.eventId} booking={b} />
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
