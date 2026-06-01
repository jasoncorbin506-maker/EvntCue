import Link from "next/link";
import { inquiryStatusLabel, slaSeverityFor } from "@/lib/labels/inquiry-status";
import { isConfirmedHold } from "@/lib/labels/deposit-status";
import type { CatrInquiry } from "@/lib/catr/inquiries";
import { formatEventDate, formatUSDCents } from "../_lib/format";
import s from "../catr.module.css";

/**
 * Single inquiry row on the Catr Inquiries tab. Tappable — links to
 * /catr/inquiries/[inquiry_id] (the inquiry-received email CTA target).
 * SLA dot + meta + status pill, mirroring the venu inquiry row.
 */
export function InquiryRow({ inquiry }: { inquiry: CatrInquiry }) {
  const sla = slaSeverityFor(inquiry.status, inquiry.hoursSinceCreated);
  const dotCls =
    sla === "fresh" ? s.slaDotFresh :
    sla === "watch" ? s.slaDotWatch :
    sla === "late" ? s.slaDotLate :
    s.slaDotClosed;

  const confirmed = isConfirmedHold(inquiry.depositStatus);

  return (
    <Link
      href={`/catr/inquiries/${inquiry.id}`}
      className={confirmed ? `${s.inqRow} ${s.inqRowHold}` : s.inqRow}
    >
      <div className={`${s.slaDot} ${dotCls}`} aria-label={`SLA ${sla}`} />
      <div className={s.inqBody}>
        <div className={s.inqHead}>
          <div className={s.inqName}>{inquiry.title}</div>
          {confirmed ? (
            <div className={s.inqHoldPill}>✓ Confirmed hold</div>
          ) : (
            <div className={s.inqStatus}>{inquiryStatusLabel(inquiry.status)}</div>
          )}
        </div>
        <div className={s.inqMeta}>
          <span>{formatEventDate(inquiry.eventDate)}</span>
          <span aria-hidden="true">·</span>
          <span>{inquiry.guestCount > 0 ? `${inquiry.guestCount} guests` : "Guests TBD"}</span>
          {inquiry.budgetCents > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatUSDCents(inquiry.budgetCents)}</span>
            </>
          )}
        </div>
        {confirmed && (
          <div className={s.inqHoldMeta}>
            Escrow funded
            {inquiry.depositAmountCents != null
              ? ` · ${formatUSDCents(inquiry.depositAmountCents)} deposit held`
              : ""}
          </div>
        )}
        {inquiry.message && <div className={s.inqMsg}>{inquiry.message}</div>}
      </div>
    </Link>
  );
}
