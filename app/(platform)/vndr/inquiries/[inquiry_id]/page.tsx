import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { getVndrInquiry } from "@/lib/vndr/inquiries";
import { inquiryStatusLabel } from "@/lib/labels/inquiry-status";

import { Chrome, ChromeSignOut } from "../../_components/Chrome";
import s from "../../vndr.module.css";

/**
 * Vendor-side inquiry detail — the inquiry-received email CTA target
 * (`/vndr/inquiries/{id}`). Full-page surface per Lock 22 (deep-linkable,
 * mobile-friendly) vs. the in-list `InquiryDetailSheet`, which stays for
 * tap-to-peek within the Inquiries tab.
 *
 * Read is RLS-bound (`inq_select` scopes to the recipient tenant), so an id
 * from another vendor's tenant returns null → 404. Reply / quote / hold
 * actions land in a later chunk; this surface is read-only for now.
 */

type Params = { inquiry_id: string };

function formatEventDate(date: string): string {
  if (!date) return "Date TBD";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(cents: number | null): string | null {
  if (cents === null) return null;
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default async function VndrInquiryDetail({
  params,
}: {
  params: Promise<Params>;
}) {
  const { inquiry_id } = await params;

  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vndr-onboarding/1");

  const inquiry = await getVndrInquiry(inquiry_id);
  if (!inquiry) notFound();

  const price = formatPrice(inquiry.proposedPriceCents);

  return (
    <>
      <Chrome
        vendorName={vendor.displayName}
        meta="Inquiry"
        right={<ChromeSignOut />}
      />

      <div className={s.dcDetail}>
        <Link href="/vndr/inquiries" className={s.dcBack}>
          ← Back to Inquiries
        </Link>

        <div className={s.dcHero}>
          <div className={s.dcEyebrow}>Inquiry · #{inquiry.id.slice(0, 8)}</div>
          <h1 className={s.dcEventName}>{formatEventDate(inquiry.eventDate)}</h1>
          <div className={s.dcEventMeta}>
            <span className={s.statusPill}>{inquiryStatusLabel(inquiry.status)}</span>
          </div>
        </div>

        <div className={s.dcChangeCard}>
          <div className={s.dcChangeRow}>
            <span className={s.dcChangeLbl}>Guests</span>
            <div className={s.dcChangeValue}>
              {inquiry.guestCount > 0 ? inquiry.guestCount : "TBD"}
            </div>
          </div>
          {price && (
            <div className={s.dcChangeRow}>
              <span className={s.dcChangeLbl}>Quote</span>
              <div className={s.dcChangeValue}>{price}</div>
            </div>
          )}
        </div>

        {inquiry.message && (
          <div className={s.dcReason}>
            <div className={s.dcReasonLbl}>Message</div>
            <div className={s.dcReasonText}>&ldquo;{inquiry.message}&rdquo;</div>
          </div>
        )}

        <div className={s.placeholder}>
          <div className={s.placeholderTitle}>Reply · Quote · Hold</div>
          <div className={s.placeholderBody}>
            Reply / quote / hold actions land in a later chunk.
          </div>
        </div>
      </div>
    </>
  );
}
