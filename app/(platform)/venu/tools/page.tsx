import { Chrome } from "../_components/Chrome";
import s from "../venu.module.css";

/**
 * Venu Tools tab — chunk C placeholder.
 * Chunk C lands: 5 cross-event tools (Venu Live · Preferred list · Atmosphere
 * Board · Your spaces · Commission flows) + Pro upsell. Commission-flow
 * labels route through lib/labels/commission-flows.ts (Lock 15 canonical
 * example — "Referral fee" not "kickback").
 */
export default function VenuTools() {
  return (
    <>
      <Chrome venueName="The Lantern Hall" roleLabel="Tools" />
      <div className={s.placeholder}>
        <div className={s.placeholderTitle}>Tools</div>
        <div className={s.placeholderBody}>
          Cross-event capabilities + Pro upsell. Lands in chunk C.
        </div>
      </div>
    </>
  );
}
