import { notFound } from "next/navigation";
import { Chrome } from "../../_components/Chrome";
import { inquiryStatusLabel } from "@/lib/labels/inquiry-status";
import { formatEventDate, formatUSDCents } from "../../_lib/demo-data";
import { getVenueInquiry } from "@/lib/venu/inquiries";
import s from "../../venu.module.css";

/**
 * Inquiry detail. Wire-DB: single-row read against venue_inquiries.
 * RLS scopes visibility to inquiries the current user can see, so an
 * id from another venue's tenant returns null → notFound. Reply / Quote /
 * Hold actions land in a later chunk.
 */
export default async function VenuInquiryDetail({
  params,
}: {
  params: Promise<{ inquiry_id: string }>;
}) {
  const { inquiry_id } = await params;
  const inquiry = await getVenueInquiry(inquiry_id);
  if (!inquiry) notFound();

  return (
    <>
      <Chrome
        venueName={inquiry.eventName}
        roleLabel={`Inquiry · #${inquiry.id.slice(0, 8)}`}
        backHref="/venu/inquiries"
      />

      <div className={s.eventHero}>
        <div className={s.eventStatusRow}>
          <div className={`${s.eventStatus} ${s.eventStatusConfirmed}`}>
            {inquiryStatusLabel(inquiry.status)}
          </div>
          <div className={s.eventId}>#{inquiry.id.slice(0, 8)}</div>
        </div>
        <div className={s.eventName}>{inquiry.eventName}</div>
        <div className={s.eventMetaGrid}>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>When</div>
            <div className={s.eventMetaVal}>{formatEventDate(inquiry.eventDate)}</div>
          </div>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>Guests</div>
            <div className={s.eventMetaVal}>{inquiry.guestCount}</div>
          </div>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>Est revenue</div>
            <div className={s.eventMetaVal}>{formatUSDCents(inquiry.budgetCents)}</div>
          </div>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>Inquired</div>
            <div className={s.eventMetaVal}>{inquiry.hoursSinceCreated}h ago</div>
          </div>
        </div>
      </div>

      <div className={s.placeholder}>
        <div className={s.placeholderTitle}>Reply · Quote · Hold</div>
        <div className={s.placeholderBody}>
          Reply / quote / hold actions land in a later chunk.
        </div>
      </div>
    </>
  );
}
