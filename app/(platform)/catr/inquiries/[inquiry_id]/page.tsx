import { notFound, redirect } from "next/navigation";

import { getCurrentCaterer } from "@/lib/catr/current-caterer";
import { getCatrInquiry } from "@/lib/catr/inquiries";
import { getSharedMoodboardPins } from "@/lib/moodboard/invites";
import { inquiryStatusLabel } from "@/lib/labels/inquiry-status";
import { isConfirmedHold } from "@/lib/labels/deposit-status";

import { Chrome, ChromeSignOut } from "../../_components/Chrome";
import { CatrInquiryThread } from "../../_components/CatrInquiryThread";
import { CatrQuotePanel } from "../../_components/CatrQuotePanel";
import { formatEventDateLong, formatUSDCents } from "../../_lib/format";
import s from "../../catr.module.css";

function formatHoldThrough(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

  // Lock 30 Phase D — shared mood board ("their vision"), if the buyer invited
  // this caterer's tenant. RLS-gated read; empty otherwise.
  const sharedPins = inquiry.buyerTenantId
    ? await getSharedMoodboardPins(inquiry.buyerTenantId)
    : [];

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
          {inquiry.venueLocation && (
            <div className={s.eventMetaItem}>
              <div className={s.eventMetaLbl}>Venue</div>
              <div className={s.eventMetaVal}>
                {inquiry.venueLocation.locationType === "home"
                  ? "Private home"
                  : inquiry.venueLocation.locationType === "business"
                    ? "Business"
                    : "Off-platform"}
                {(inquiry.venueLocation.line1 || inquiry.venueLocation.city) && (
                  <div className={s.eventMetaLbl} style={{ marginTop: 2 }}>
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
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isConfirmedHold(inquiry.depositStatus) && (
        <div className={s.holdBanner}>
          <div className={s.holdBannerTitle}>✓ Confirmed hold · escrow funded</div>
          <div className={s.holdBannerBody}>
            This client has a deposit on file
            {inquiry.depositAmountCents != null
              ? ` (${formatUSDCents(inquiry.depositAmountCents)} held)`
              : ""}
            .
            {inquiry.holdExpiresAt
              ? ` Date held through ${formatHoldThrough(inquiry.holdExpiresAt)}.`
              : ""}{" "}
            This is a qualified, cash-backed booking — not a tire-kicker.
          </div>
        </div>
      )}

      {inquiry.message && (
        <div className={s.messageCard}>
          <div className={s.messageLbl}>Message</div>
          <div className={s.messageText}>&ldquo;{inquiry.message}&rdquo;</div>
        </div>
      )}

      {sharedPins.length > 0 && (
        <div className={s.messageCard}>
          <div className={s.messageLbl}>Their vision · shared mood board</div>
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

      <CatrQuotePanel
        inquiryId={inquiry.id}
        status={inquiry.status}
        quotedPriceCents={inquiry.quotedPriceCents}
        expiresAt={inquiry.expiresAt}
        buyerRole={inquiry.buyerRole}
      />

      <CatrInquiryThread inquiryId={inquiry.id} buyerRole={inquiry.buyerRole} />
    </>
  );
}
