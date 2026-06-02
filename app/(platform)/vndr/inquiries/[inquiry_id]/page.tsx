import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { getVndrInquiry, type VndrInquiryStatus } from "@/lib/vndr/inquiries";
import { getSharedMoodboardPins } from "@/lib/moodboard/invites";
import { inquiryStatusLabel } from "@/lib/labels/inquiry-status";

import { Chrome, ChromeSignOut } from "../../_components/Chrome";
import { InquiryQuotePanel } from "../../_components/InquiryQuotePanel";
import { InquiryThread } from "../../_components/InquiryThread";
import s from "../../vndr.module.css";

// Status → pill color modifier. `.statusPill` is colorless on its own; the
// pill* class supplies the background + text color. Mirrors the list's
// STATUS_PILL mapping (vndr/_components/InquiriesList.tsx) so the detail
// surface reads identically to the row a vendor tapped from.
const STATUS_PILL_CLASS: Record<VndrInquiryStatus, string | undefined> = {
  inquiry: s.pillNew,
  reviewing: s.pillReviewing,
  quoted: s.pillQuoted,
  penciled: s.pillQuoted,
  inked: s.pillBooked,
  booked: s.pillBooked,
  closed: s.pillLost,
};

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

  // Lock 30 Phase D — if the buyer invited this vendor to their mood board,
  // the RLS-gated read returns its pins ("their vision").
  const sharedPins = await getSharedMoodboardPins(inquiry.buyerTenantId);

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
            <span className={`${s.statusPill} ${STATUS_PILL_CLASS[inquiry.status] ?? ""}`.trim()}>
              {inquiryStatusLabel(inquiry.status)}
            </span>
          </div>
        </div>

        <div className={s.dcChangeCard}>
          <div className={s.dcChangeRow}>
            <span className={s.dcChangeLbl}>Guests</span>
            <div className={s.dcChangeValue}>
              {inquiry.guestCount > 0 ? inquiry.guestCount : "TBD"}
            </div>
          </div>
          {inquiry.venueLocation && (
            <>
              <div className={s.dcChangeRow}>
                <span className={s.dcChangeLbl}>Venue</span>
                <div className={s.dcChangeValue}>
                  {inquiry.venueLocation.locationType === "home"
                    ? "Private home"
                    : inquiry.venueLocation.locationType === "business"
                      ? "Business"
                      : "Off-platform"}
                </div>
              </div>
              {(inquiry.venueLocation.line1 || inquiry.venueLocation.city) && (
                <div className={s.dcChangeRow}>
                  <span className={s.dcChangeLbl}>Address</span>
                  <div className={s.dcChangeValue}>
                    {[
                      inquiry.venueLocation.line1,
                      inquiry.venueLocation.line2,
                      inquiry.venueLocation.city,
                      inquiry.venueLocation.state,
                      inquiry.venueLocation.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {inquiry.message && (
          <div className={s.dcReason}>
            <div className={s.dcReasonLbl}>Message</div>
            <div className={s.dcReasonText}>&ldquo;{inquiry.message}&rdquo;</div>
          </div>
        )}

        {sharedPins.length > 0 && (
          <div className={s.dcReason}>
            <div className={s.dcReasonLbl}>Their vision · shared mood board</div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 8 }}>
              {sharedPins.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={p.url}
                  alt={p.alt ?? "Mood board pin"}
                  loading="lazy"
                  style={{ flex: "0 0 auto", width: "46%", maxWidth: 220, aspectRatio: "3 / 2", objectFit: "cover", borderRadius: 10 }}
                />
              ))}
            </div>
          </div>
        )}

        <InquiryQuotePanel
          inquiryId={inquiry.id}
          status={inquiry.status}
          quotedPriceCents={inquiry.proposedPriceCents}
          expiresAt={inquiry.expiresAt}
          buyerRole={inquiry.buyerRole}
        />

        <InquiryThread inquiryId={inquiry.id} buyerRole={inquiry.buyerRole} />
      </div>
    </>
  );
}
