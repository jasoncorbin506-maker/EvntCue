import Link from "next/link";
import { inquiryStatusLabel, slaSeverityFor } from "@/lib/labels/inquiry-status";
import { formatEventDate, formatUSDCents } from "../_lib/demo-data";
import type { VenuInquiry } from "@/lib/venu/inquiries";
import s from "../venu.module.css";

/**
 * Single inquiry row on the Inquiries tab. Tappable — links to
 * /venu/inquiries/[inquiry_id] for the detail view (placeholder in chunk B;
 * real reply/quote/hold UI in a later chunk).
 *
 * Visual: SLA dot (color from slaSeverityFor) + event meta + status pill
 * (Lock 15 display label via inquiryStatusLabel) + qualification badges.
 *
 * Source: built fresh from Venu_Locked_2026-05-13.md row 2 spec. Visual
 * language inherits from event-action / pill patterns established earlier.
 */
export function InquiryRow({ inquiry }: { inquiry: VenuInquiry }) {
  const sla = slaSeverityFor(inquiry.status, inquiry.hoursSinceCreated);
  const dotCls =
    sla === "fresh" ? s.slaDotFresh :
    sla === "watch" ? s.slaDotWatch :
    sla === "late" ? s.slaDotLate :
    s.slaDotClosed;

  return (
    <Link href={`/venu/inquiries/${inquiry.id}`} className={s.inqRow}>
      <div className={`${s.slaDot} ${dotCls}`} aria-label={`SLA ${sla}`} />
      <div className={s.inqBody}>
        <div className={s.inqHead}>
          <div className={s.inqName}>{inquiry.eventName}</div>
          <div className={s.inqStatus}>{inquiryStatusLabel(inquiry.status)}</div>
        </div>
        <div className={s.inqMeta}>
          <span>{formatEventDate(inquiry.eventDate)}</span>
          <span aria-hidden="true">·</span>
          <span>{inquiry.guestCount} guests</span>
          <span aria-hidden="true">·</span>
          <span>{formatUSDCents(inquiry.budgetCents)}</span>
        </div>
        {inquiry.badges.length > 0 && (
          <div className={s.inqBadges}>
            {inquiry.badges.map((b) => (
              <span key={b} className={s.inqBadge}>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
