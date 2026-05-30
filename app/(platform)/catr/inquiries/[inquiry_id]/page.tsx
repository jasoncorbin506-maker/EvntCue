import { notFound, redirect } from "next/navigation";

import { getCurrentCaterer } from "@/lib/catr/current-caterer";
import { getCatrInquiry } from "@/lib/catr/inquiries";
import { inquiryStatusLabel } from "@/lib/labels/inquiry-status";

import { Chrome, ChromeSignOut } from "../../_components/Chrome";
import { CatrInquiryThread } from "../../_components/CatrInquiryThread";
import { formatEventDateLong, formatUSDCents } from "../../_lib/format";
import s from "../../catr.module.css";

/**
 * Catr inquiry detail — the inquiry-received email CTA target
 * (`/catr/inquiries/{id}`). Read is RLS-bound (`inq_select` scopes to the
 * recipient tenant), so an id from another caterer's tenant returns null →
 * 404. Read-only for now; reply / quote / hold actions land in a later chunk.
 */
type Params = { inquiry_id: string };

export default async function CatrInquiryDetail({
  params,
}: {
  params: Promise<Params>;
}) {
  const { inquiry_id } = await params;

  const caterer = await getCurrentCaterer();
  if (!caterer) redirect("/login?role=catr");

  const inquiry = await getCatrInquiry(inquiry_id);
  if (!inquiry) notFound();

  return (
    <>
      <Chrome
        catererName={caterer.displayName}
        roleLabel={`Inquiry · #${inquiry.id.slice(0, 8)}`}
        backHref="/catr/inquiries"
        right={<ChromeSignOut />}
      />

      <div className={s.eventHero}>
        <div className={s.eventStatusRow}>
          <div className={s.eventStatus}>{inquiryStatusLabel(inquiry.status)}</div>
          <div className={s.eventId}>#{inquiry.id.slice(0, 8)}</div>
        </div>
        <div className={s.eventName}>{inquiry.title}</div>
        <div className={s.eventMetaGrid}>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>When</div>
            <div className={s.eventMetaVal}>{formatEventDateLong(inquiry.eventDate)}</div>
          </div>
          <div className={s.eventMetaItem}>
            <div className={s.eventMetaLbl}>Guests</div>
            <div className={s.eventMetaVal}>
              {inquiry.guestCount > 0 ? inquiry.guestCount : "TBD"}
            </div>
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

      {inquiry.message && (
        <div className={s.messageCard}>
          <div className={s.messageLbl}>Message</div>
          <div className={s.messageText}>&ldquo;{inquiry.message}&rdquo;</div>
        </div>
      )}

      <CatrInquiryThread inquiryId={inquiry.id} buyerRole={inquiry.buyerRole} />
    </>
  );
}
