import { Chrome } from "../_components/Chrome";
import s from "../venu.module.css";

/**
 * Venu Inquiries tab — chunk B placeholder.
 * Chunk B lands: New / Quoted / Held / Closed segment, inquiry rows with SLA
 * dots and qualification badges. Uses lib/labels/inquiry-status.ts when wired
 * (PARKING_LOT #42 — Lock 15 audit: `inked` likely surfaces as `signed`).
 */
export default function VenuInquiries() {
  return (
    <>
      <Chrome venueName="The Lantern Hall" roleLabel="Inquiries" />
      <div className={s.placeholder}>
        <div className={s.placeholderTitle}>Inquiries</div>
        <div className={s.placeholderBody}>
          New / Quoted / Held / Closed lands in chunk B.
        </div>
      </div>
    </>
  );
}
