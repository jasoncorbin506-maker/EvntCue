import { inquiryStatusLabel, slaSeverityFor } from "@/lib/labels/inquiry-status";
import {
  type DemoInquiry,
  formatEventDate,
  formatUSDCents,
} from "../_lib/demo-data";
import s from "../venu.module.css";

/**
 * Single inquiry row on the Inquiries tab. Renders:
 *  - SLA dot (left) — color from slaSeverityFor()
 *  - event title (Cormorant italic) + meta line (date · headcount · budget)
 *  - status pill (right) — Lock 15 display label via inquiryStatusLabel()
 *  - qualification badges below
 *
 * Source mockup: built fresh from Venu_Locked_2026-05-13.md row 2 spec.
 * No direct HTML reference in the 3-screen mockup — visual language inherits
 * from the section / event-action / pill patterns established in chunks A
 * and the Tools/Money mockup screens.
 */
export function InquiryRow({ inquiry }: { inquiry: DemoInquiry }) {
  const sla = slaSeverityFor(inquiry.status, inquiry.hoursSinceCreated);
  const dotCls =
    sla === "fresh" ? s.slaDotFresh :
    sla === "watch" ? s.slaDotWatch :
    sla === "late" ? s.slaDotLate :
    s.slaDotClosed;

  return (
    <div className={s.inqRow}>
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
    </div>
  );
}
