import { Chrome } from "../_components/Chrome";
import s from "../venu.module.css";

/**
 * Venu Bookings tab — chunk B placeholder.
 * Chunk B lands: Today / This week / Rest of month vertical scroll groups.
 * No calendar grid on mobile per Venu_Locked_2026-05-13.md nav row 3.
 */
export default function VenuBookings() {
  return (
    <>
      <Chrome venueName="The Lantern Hall" roleLabel="Bookings" />
      <div className={s.placeholder}>
        <div className={s.placeholderTitle}>Bookings</div>
        <div className={s.placeholderBody}>
          Today / This week / Rest of month — vertical scroll, no calendar grid. Lands in chunk B.
        </div>
      </div>
    </>
  );
}
