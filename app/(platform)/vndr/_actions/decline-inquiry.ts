"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEventActive } from "@/lib/events/activation";
import { logSkippedSend } from "@/lib/email/audit";
import {
  buyerRoleToPortal,
  type BuyerRole,
} from "@/lib/inquiries/create-inquiry-shared";

/**
 * V-2b smoke-fix (session 23 — 2026-05-25 — brief G2): vendor declines a
 * booking inquiry. Transitions status to `closed` (which falls under the
 * "Lost" filter chip per Jason's session 22 filter mapping). RLS gates the
 * write via recipient_tenant_id; the .in() guard rejects already-committed
 * inquiries.
 *
 * Allowed source statuses: inquiry, reviewing, quoted. Penciled / inked /
 * booked are commitments that need the cancellation flow (V-2c, Lock 24
 * territory), NOT decline.
 *
 * No `decline_reason` column on inquiries (verified via Supabase MCP). The
 * decline email (Phase 2) omits the reason → the renderer falls back to a
 * neutral "They didn't share a reason." line. Reason capture is a future brief.
 *
 * Phase 2 (booking-lifecycle emails): after the status transition commits, the
 * buyer is notified via the branded `decline` email — fire-and-forget, never
 * fails the decline (the in-app row is the source of truth, Lock 22 / Lock 24).
 */

export type DeclineInquiryResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function declineInquiry(
  inquiryId: string,
): Promise<DeclineInquiryResult> {
  if (!inquiryId) return { ok: false, error: "Missing inquiry id." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .update({
      status: "closed",
      responded_at: new Date().toISOString(),
    })
    .eq("id", inquiryId)
    .in("status", ["inquiry", "reviewing", "quoted"])
    .select("id, buyer_tenant_id, buyer_role, recipient_tenant_id, event_id, event_date")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message ??
        "Decline failed — inquiry may already be at a committed state.",
    };
  }

  // Buyer notification — fire-and-forget. A send failure never fails the
  // decline; the status transition above is already durable.
  await sendDeclineEmail({
    inquiryId: data.id as string,
    buyerTenantId: data.buyer_tenant_id as string | null,
    buyerRole: data.buyer_role as string | null,
    sellerTenantId: data.recipient_tenant_id as string,
    eventId: data.event_id as string | null,
    eventDate: data.event_date as string | null,
  }).catch((e) => {
    console.warn(`declineInquiry: email send threw for ${inquiryId}: ${String(e)}`);
  });

  revalidatePath("/vndr/inquiries");
  revalidatePath("/vndr");
  return { ok: true, id: data.id as string };
}

/**
 * Resolve the buyer's notification email + locale and fire the branded
 * `decline` email. Never throws — logs + returns on any missing-data path so
 * the caller can treat it as fire-and-forget.
 *
 * Skips silently (no email, no error) when there's nothing honest to send:
 *   - no parent event (can't activation-gate or build the "Open event" link)
 *   - no buyer tenant (a client_name-only inquiry has no platform user to mail)
 *   - no deliverable buyer address
 *
 * Lock 27 activation gate: if the parent event is no longer active, the send is
 * skipped and recorded to email_send_audit (logSkippedSend) — the decline path
 * has no upstream gate, so this is the real enforcement site.
 */
async function sendDeclineEmail(args: {
  inquiryId: string;
  buyerTenantId: string | null;
  buyerRole: string | null;
  sellerTenantId: string;
  eventId: string | null;
  eventDate: string | null;
}): Promise<void> {
  try {
    // No parent event → can't gate or link; nothing honest to send.
    if (!args.eventId) return;
    // client_name-only inquiry → no platform user to notify.
    if (!args.buyerTenantId) return;

    const admin = createAdminClient();

    const { data: event } = await admin
      .from("events")
      .select("name, status, start_date")
      .eq("id", args.eventId)
      .maybeSingle();
    if (!event) return;

    // Lock 27 activation-gate defensive check — skip + audit on a non-active event.
    if (!isEventActive(event.status as string | null)) {
      await logSkippedSend({
        template: "decline",
        reason: "event_not_active",
        eventId: args.eventId,
        inquiryId: args.inquiryId,
        recipientTenantId: args.sellerTenantId,
        admin,
      });
      return;
    }

    // Seller (the declining tenant) display name → shown to the buyer.
    const { data: sellerTenant } = await admin
      .from("tenants")
      .select("name")
      .eq("id", args.sellerTenantId)
      .maybeSingle();
    const sellerName = (sellerTenant?.name as string | null)?.trim() || "A seller";

    // Buyer's primary user → deliverable address + locale.
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("users!inner ( email, language_preference )")
      .eq("tenant_id", args.buyerTenantId)
      .eq("is_primary", true)
      .limit(1);
    const primary = (roleRows?.[0]?.users ?? null) as {
      email?: string;
      language_preference?: string;
    } | null;
    const toEmail = primary?.email?.trim() || null;
    if (!toEmail) return; // no deliverable address — skip silently
    const locale = primary?.language_preference === "es" ? "es" : "en";

    const buyerPortal = buyerRoleToPortal(args.buyerRole);
    const buyerRole: BuyerRole = args.buyerRole === "venue" ? "venue" : "orgnz";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://evntcue.com";
    const ctaUrl = `${baseUrl}/${buyerPortal}/events/${args.eventId}`;

    const { renderDeclineEmail } = await import(
      "@/lib/email/templates/booking-lifecycle"
    );
    const { sendEmail } = await import("@/lib/email/send");

    const content = renderDeclineEmail({
      buyerRole,
      sellerName,
      eventName: (event.name as string | null) ?? "your event",
      // inquiry's date hint, else the event's start_date (event_date is nullable).
      eventDate: args.eventDate ?? (event.start_date as string | null) ?? "",
      // reason omitted — no decline_reason column; renderer falls back gracefully.
      ctaUrl,
      locale,
    });

    const result = await sendEmail({
      to: toEmail,
      subject: content.subject,
      text: content.text,
      html: content.html,
      tags: [
        { name: "kind", value: "decline" },
        { name: "inquiry_id", value: args.inquiryId },
      ],
    });
    if (!result.ok) {
      console.warn(
        `declineInquiry: decline email failed for ${args.inquiryId}: ${result.error}`,
      );
    }
  } catch (e) {
    console.warn(
      `declineInquiry: decline email error for ${args.inquiryId}: ${String(e)}`,
    );
  }
}
