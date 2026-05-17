import { Chrome } from "../_components/Chrome";
import { BookingRow } from "../_components/BookingRow";
import { DEMO_BOOKINGS, groupBookings } from "../_lib/demo-data";
import s from "../venu.module.css";

/**
 * Venu Bookings tab — Today / This week / Rest of month vertical scroll
 * groups per Venu_Locked_2026-05-13.md row 3. No calendar grid on mobile.
 *
 * Empty groups render their header + a one-line empty hint; non-empty groups
 * render the BookingRow list. Tapping any row drills into the event detail
 * view at /venu/bookings/[event_id] per the spine principle.
 *
 * Chunk B uses stub demo data. Real reads against bookings + events land in
 * a later chunk; the groupBookings() helper accepts the same shape.
 */
export default function VenuBookings() {
  // Use a stable "today" so the grouping is deterministic in the eyeball.
  const today = new Date(2026, 4, 17); // 2026-05-17, matches Hartwell wedding
  const groups = groupBookings(DEMO_BOOKINGS, today);

  return (
    <>
      <Chrome venueName="The Lantern Hall" roleLabel="Bookings" />
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
              {group.key === "today" ? "Nothing scheduled today." : "Nothing this week."}
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
