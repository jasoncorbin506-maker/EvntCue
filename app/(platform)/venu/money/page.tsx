import { Chrome } from "../_components/Chrome";
import s from "../venu.module.css";

/**
 * Venu Money tab — chunk C placeholder.
 * Chunk C lands: hero take-home number, segmented period control (This event
 * / This month / YTD / Trends), breakdown, Pro hint at bottom.
 */
export default function VenuMoney() {
  return (
    <>
      <Chrome venueName="The Lantern Hall" roleLabel="Money" />
      <div className={s.placeholder}>
        <div className={s.placeholderTitle}>Money</div>
        <div className={s.placeholderBody}>
          Take-home hero + period segments + breakdown + Pro hint. Lands in chunk C.
        </div>
      </div>
    </>
  );
}
