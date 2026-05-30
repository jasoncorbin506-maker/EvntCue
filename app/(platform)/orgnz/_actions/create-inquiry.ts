"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";
import { assertEventActive, isEventActive } from "@/lib/events/activation";
import { logSkippedSend } from "@/lib/email/audit";
import { logEventHistoryWrite } from "@/lib/events/timing";
import {
  INQUIRY_ERRORS,
  type InquiryErrorCode,
  tenantTypeToSellerPortal,
  validateInquiryMessage,
  resolveInquiryEventDate,
} from "@/lib/inquiries/create-inquiry-shared";

/**
 * Phase 2b-W1 — buyer-initiated inquiry creation (orgnz buyer).
 *
 * The primitive that makes the `inquiry-received` email real: before this,
 * `inquiries` rows existed only via the seeder. An organizer sends an inquiry
 * to a seller tenant (vndr / venu / catr — plnr is a coordinator surface, not a
 * receiver); we INSERT the row under the buyer's RLS (policy `inq_insert_buyer`
 * checks buyer_tenant_id ∈ the user's tenants AND role = buyer_role), stamp the
 * `recipient_type` discriminator, audit it to event_history (Lock 23), and
 * fire the seller's branded notification email (Lock 24 target resolution,
 * fire-and-forget — a send failure never fails the inquiry).
 *
 * Lock 27: the parent event must be `active`. A draft is a non-transactional
 * planning sandbox; inquiries are a real-counterparty touch. We call
 * assertEventActive(event.status) before inserting; on a draft we return
 * EVENT_NOT_ACTIVATED for the UI to surface via a Lock 22 toast that routes to
 * the activation affordance (inform + invite, never hard-block) — no row, no
 * email.
 *
 * Scope (Phase 2b-A): **orgnz buyer only.** Lock 26's venue-as-buyer path is
 * deferred — the `events` table is `orgnz_tenant_id NOT NULL` with no venue
 * ownership column, so a venue can't yet own the event an inquiry attaches to
 * (the brief flagged this may need its own brief). buyer_role is still written
 * explicitly so the venue branch is a one-line add once event ownership lands.
 */

export type CreateInquiryInput = {
  /** Seller tenant receiving the inquiry. */
  vndrTenantId: string;
  /** Parent event the inquiry is about. Must be owned by the organizer + active. */
  eventId: string;
  /** Buyer's message. Required (validated). */
  message: string;
  /** Optional date hint; defaults to the event's start_date. */
  eventDate?: string | null;
  /** Optional headcount hint. */
  guestCount?: number | null;
};

export type CreateInquiryResult =
  | { ok: true; inquiryId: string }
  | { ok: false; error: InquiryErrorCode | "auth" | "insert_failed" };

export async function createInquiry(
  input: CreateInquiryInput,
): Promise<CreateInquiryResult> {
  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, error: "auth" };

  if (!input.vndrTenantId) return { ok: false, error: INQUIRY_ERRORS.INVALID_SELLER };

  const msg = validateInquiryMessage(input.message);
  if (!msg.ok) return { ok: false, error: msg.error };

  const supabase = await createClient();

  // Load the parent event under the buyer's RLS. orgnz_tenant_id guard ensures
  // it's *this* organizer's event (not one they merely participate in).
  const { data: event } = await supabase
    .from("events")
    .select("id, name, start_date, status, orgnz_tenant_id")
    .eq("id", input.eventId)
    .maybeSingle();
  if (!event || (event.orgnz_tenant_id as string) !== organizer.tenantId) {
    return { ok: false, error: INQUIRY_ERRORS.EVENT_NOT_FOUND };
  }

  // Lock 27 gate — drafts can't transact.
  const gate = assertEventActive(event.status as string | null);
  if (!gate.ok) return { ok: false, error: INQUIRY_ERRORS.EVENT_NOT_ACTIVATED };

  // Validate the seller tenant exists + is a valid recipient type. Reading
  // another tenant's row needs the service-role client (tenants are private).
  const admin = createAdminClient();
  const { data: sellerTenant } = await admin
    .from("tenants")
    .select("id, name, type")
    .eq("id", input.vndrTenantId)
    .maybeSingle();
  const sellerPortal = tenantTypeToSellerPortal(
    sellerTenant?.type as string | null | undefined,
  );
  // plnr is a coordinator surface, not a same-shape inquiry receiver: the
  // unified `inquiries.recipient_type` CHECK only admits vndr|catr|venu. Reject
  // a plnr recipient here so the narrowed type flows into the INSERT below.
  if (!sellerTenant || !sellerPortal || sellerPortal === "plnr") {
    return { ok: false, error: INQUIRY_ERRORS.INVALID_SELLER };
  }

  const eventDate = resolveInquiryEventDate(
    input.eventDate,
    event.start_date as string,
  );

  // INSERT under the buyer's RLS (policy inq_insert_buyer enforces buyer
  // ownership + role match). status starts at the enum's first state, 'inquiry'.
  const { data: inserted, error: insertErr } = await supabase
    .from("inquiries")
    .insert({
      buyer_tenant_id: organizer.tenantId,
      buyer_role: "orgnz",
      recipient_tenant_id: input.vndrTenantId,
      recipient_type: sellerPortal,
      event_id: input.eventId,
      event_date: eventDate,
      guest_count: input.guestCount ?? null,
      message: msg.message,
      status: "inquiry",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) return { ok: false, error: "insert_failed" };
  const inquiryId = inserted.id as string;

  // Audit (Lock 23). Non-fatal — the inquiry is already durable.
  await logEventHistoryWrite(admin, {
    eventId: input.eventId,
    field: "inquiry_created",
    oldValue: null,
    newValue: inquiryId,
    userId: organizer.userId,
    reason: `Inquiry sent to ${sellerTenant.name as string}`,
  });

  // Seller notification email — fire-and-forget (Lock 22 / Lock 24). A failed
  // send never fails the inquiry; the in-app row is the source of truth.
  await sendInquiryReceivedEmail({
    sellerTenantId: input.vndrTenantId,
    sellerPortal,
    buyerName: organizer.tenantName,
    eventId: input.eventId,
    eventStatus: event.status as string | null,
    eventName: event.name as string,
    eventDate,
    inquiryId,
    message: msg.message,
  }).catch((e) => {
    console.warn(`createInquiry: email send threw for ${inquiryId}: ${String(e)}`);
  });

  revalidatePath("/orgnz/inquiries");
  revalidatePath("/orgnz");
  return { ok: true, inquiryId };
}

/**
 * Resolve the seller's notification email + locale and fire the branded
 * `inquiry-received` email. Lock 24 target resolution: the seller's business
 * contact (`vendors.contact_email`) when set, else the primary user's login
 * email. Locale follows the recipient's language_preference. Never throws —
 * logs + returns on any failure (caller treats it as fire-and-forget).
 *
 * `city` is intentionally omitted: the `events` table carries no location, so
 * there's no honest source for it at inquiry time (the renderer's `city` is
 * optional). Revisit if/when events gain a location field.
 *
 * Lock 27 activation-gate defensive check: this path is already gated upstream
 * (createInquiry returns EVENT_NOT_ACTIVATED before any row/email on a draft),
 * so the guard below is belt-and-suspenders — it makes the send-site honor the
 * gate independently and records any skip to email_send_skips, matching the
 * decline path which has no upstream gate.
 */
async function sendInquiryReceivedEmail(args: {
  sellerTenantId: string;
  sellerPortal: "vndr" | "venu" | "plnr" | "catr";
  buyerName: string;
  eventId: string;
  eventStatus: string | null;
  eventName: string;
  eventDate: string;
  inquiryId: string;
  message: string;
}): Promise<void> {
  try {
    if (!isEventActive(args.eventStatus)) {
      await logSkippedSend({
        template: "inquiry-received",
        reason: "event_not_active",
        eventId: args.eventId,
        inquiryId: args.inquiryId,
        recipientTenantId: args.sellerTenantId,
      });
      return;
    }

    const admin = createAdminClient();

    // Primary user's login email + locale (fallback target + locale source).
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("users!inner ( email, language_preference )")
      .eq("tenant_id", args.sellerTenantId)
      .eq("is_primary", true)
      .limit(1);
    const primary = (roleRows?.[0]?.users ?? null) as {
      email?: string;
      language_preference?: string;
    } | null;
    const locale = primary?.language_preference === "es" ? "es" : "en";

    // Lock 24: business contact wins over the operator's login email.
    const { data: vendorRow } = await admin
      .from("vendors")
      .select("contact_email")
      .eq("tenant_id", args.sellerTenantId)
      .maybeSingle();
    const contactEmail = (vendorRow?.contact_email as string | null)?.trim() || null;
    const toEmail = contactEmail ?? primary?.email ?? null;
    if (!toEmail) return; // no deliverable address — skip silently

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://evntcue.com";
    const ctaUrl = `${baseUrl}/${args.sellerPortal}/inquiries/${args.inquiryId}`;

    const { renderInquiryReceivedEmail } = await import(
      "@/lib/email/templates/booking-lifecycle"
    );
    const { sendEmail } = await import("@/lib/email/send");

    const content = renderInquiryReceivedEmail({
      sellerPortal: args.sellerPortal,
      buyerName: args.buyerName,
      buyerRole: "orgnz",
      eventName: args.eventName,
      eventDate: args.eventDate,
      message: args.message,
      ctaUrl,
      locale,
    });

    const result = await sendEmail({
      to: toEmail,
      subject: content.subject,
      text: content.text,
      html: content.html,
      tags: [
        { name: "kind", value: "inquiry-received" },
        { name: "inquiry_id", value: args.inquiryId },
      ],
    });
    if (!result.ok) {
      console.warn(
        `createInquiry: inquiry-received email failed for ${args.inquiryId}: ${result.error}`,
      );
    }
  } catch (e) {
    console.warn(
      `createInquiry: inquiry-received email error for ${args.inquiryId}: ${String(e)}`,
    );
  }
}
