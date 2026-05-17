import { Chrome } from "../../_components/Chrome";
import s from "../../venu.module.css";

/**
 * Venu Event Detail — chunk B placeholder.
 *
 * Per the spine-of-the-platform principle in Venu_Locked_2026-05-13.md, every
 * event_id-scoped surface lives inside this view: BEO acknowledgment, seat
 * chart, timeline, vendor roster, money-for-this-event, messages with the
 * Orgnz. Chunk B replaces the simple Chrome with a back-button variant per
 * the mockup's Screen 2 chrome.
 */
export default async function VenuEventDetail({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;
  return (
    <>
      <Chrome venueName={`Event ${event_id.slice(0, 8)}…`} roleLabel="Booking detail" />
      <div className={s.placeholder}>
        <div className={s.placeholderTitle}>Event detail</div>
        <div className={s.placeholderBody}>
          BEO · seat chart · timeline · vendor roster · money · messages. Lands in chunk B.
        </div>
      </div>
    </>
  );
}
