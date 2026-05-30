import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { isEventActive } from "@/lib/events/activation";

/**
 * Resend webhook — delivery-lifecycle sink for all transactional sends.
 *
 * Two coexisting branches on every event (Phase 3 / Workstream 1):
 *
 *   1. Generic `email_send_audit` (migration 075). Sends made through
 *      lib/email/send.ts with an `audit` arg are tagged with
 *      `email_send_audit_id`; we stamp delivery state onto the matching row:
 *        - email.delivered        → delivered_at
 *        - email.bounced          → bounced_at + bounce_kind (hard/soft)
 *        - email.complained       → complained_at
 *        - email.delivery_delayed → delivery_delayed_at + soft_bounce_count++
 *
 *   2. Lock 24 legacy (UNTOUCHED). On email.bounced, sends tagged with
 *      `notification_id` still flip event_notifications.payload.
 *      email_delivery_failed = true (orgnz EXPIRED card surfaces it). A
 *      date-change send now carries BOTH tags, so both branches run —
 *      belt and suspenders, no regression.
 *
 * Workstream 2 — cross-party notice: when a SELLER-recipient inquiry/booking
 * send hard-bounces (or a soft bounce reaches the retry threshold), we email
 * the waiting buyer so the seller's silence is explained. Eligibility is keyed
 * on the audit row's template_kind (buyer-recipient sends like `decline` are
 * never cross-party-eligible). Idempotent via a claim on cross_party_notified_at.
 *
 * Auth: HMAC-SHA256 over the raw body with RESEND_WEBHOOK_SECRET, constant-time
 * compared against the `resend-signature` header (Hard Rule #9). Without the
 * secret the route 401s every request (safe default). Unchanged from Lock 24.
 */

type ResendWebhookEvent = {
  type: string; // "email.bounced", "email.complained", "email.delivered", ...
  data: {
    email_id?: string;
    tags?: Array<{ name: string; value: string }>;
    bounce?: { type?: string; message?: string };
  };
};

type BounceKind = "hard" | "soft";

/** Seller-recipient templates whose bounce warrants a cross-party buyer notice. */
const CROSS_PARTY_ELIGIBLE = new Set<string>(["inquiry-received"]);

/** Sustained soft-bounce count before we surface a soft failure (Resend retries). */
const SOFT_BOUNCE_THRESHOLD = 3;

/**
 * Map Resend's SES-style bounce classification to hard/soft. `Permanent` is a
 * hard reject; `Transient` is a retriable soft bounce. `Undetermined` (and any
 * unknown/missing value) is treated as soft — conservatively, we don't fire an
 * irreversible cross-party notice on an ambiguous bounce.
 */
function parseBounceKind(raw: string | undefined): BounceKind {
  return (raw ?? "").toLowerCase() === "permanent" ? "hard" : "soft";
}

async function verifySignature(
  request: Request,
  body: string,
  secret: string,
): Promise<boolean> {
  const provided = request.headers.get("resend-signature");
  if (!provided) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (sigHex.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < sigHex.length; i += 1) {
    diff |= sigHex.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

/** Lock 24 legacy branch — flip email_delivery_failed on the matching row. */
async function flipLock24DeliveryFailed(
  admin: SupabaseClient,
  notificationId: string,
): Promise<void> {
  // Supabase JS doesn't expose `jsonb || jsonb`; read-modify-write the payload.
  // Bounce frequency for a single notification is very low → race window minor.
  const { data: row, error: readErr } = await admin
    .from("event_notifications")
    .select("payload")
    .eq("id", notificationId)
    .maybeSingle();
  if (readErr || !row) return; // deleted/never-existed → nothing to patch
  const current = (row.payload ?? {}) as Record<string, unknown>;
  await admin
    .from("event_notifications")
    .update({ payload: { ...current, email_delivery_failed: true } })
    .eq("id", notificationId);
}

type AuditRow = {
  id: string;
  template_kind: string;
  recipient_email: string;
  recipient_tenant_id: string | null;
  related_entity_kind: string | null;
  related_entity_id: string | null;
  sent_at: string;
  soft_bounce_count: number;
  cross_party_notified_at: string | null;
};

const AUDIT_COLS =
  "id, template_kind, recipient_email, recipient_tenant_id, related_entity_kind, related_entity_id, sent_at, soft_bounce_count, cross_party_notified_at";

/**
 * Workstream 2 — fire the cross-party buyer notice for a bounced seller send.
 * Best-effort: any missing dependency (inquiry gone, no buyer email, inactive
 * event) is a clean no-op. Idempotency is a conditional claim on
 * cross_party_notified_at so concurrent duplicate webhooks fire at most once.
 */
async function maybeFireCrossParty(
  admin: SupabaseClient,
  row: AuditRow,
  bounceKind: BounceKind,
  softBounceCount: number,
): Promise<void> {
  if (!CROSS_PARTY_ELIGIBLE.has(row.template_kind)) return;
  if (row.cross_party_notified_at) return;
  if (bounceKind === "soft" && softBounceCount < SOFT_BOUNCE_THRESHOLD) return;
  if (row.related_entity_kind !== "inquiry" || !row.related_entity_id) return;

  // Load the inquiry → buyer + event context.
  const { data: inquiry } = await admin
    .from("inquiries")
    .select("buyer_tenant_id, buyer_role, recipient_tenant_id, event_id, event_date")
    .eq("id", row.related_entity_id)
    .maybeSingle();
  if (!inquiry?.buyer_tenant_id || !inquiry.event_id) return;

  // Seller display name (the tenant we failed to reach).
  const { data: sellerTenant } = await admin
    .from("tenants")
    .select("name")
    .eq("id", (inquiry.recipient_tenant_id as string) ?? row.recipient_tenant_id)
    .maybeSingle();
  const sellerName = (sellerTenant?.name as string | null)?.trim() || "the seller";

  // Event name + activation gate (Lock 27 defensive check).
  const { data: event } = await admin
    .from("events")
    .select("name, status")
    .eq("id", inquiry.event_id as string)
    .maybeSingle();
  if (!isEventActive(event?.status as string | null)) {
    const { logSkippedSend } = await import("@/lib/email/audit");
    await logSkippedSend({
      template: "delivery-failure-cross-party",
      reason: "event_not_active",
      eventId: inquiry.event_id as string,
      inquiryId: row.related_entity_id,
      recipientTenantId: inquiry.buyer_tenant_id as string,
      admin,
    });
    return;
  }
  const eventName = (event?.name as string | null)?.trim() || "your event";

  // Buyer's primary user → deliverable address + locale.
  const { data: roleRows } = await admin
    .from("user_roles")
    .select("users!inner ( email, language_preference )")
    .eq("tenant_id", inquiry.buyer_tenant_id as string)
    .eq("is_primary", true)
    .limit(1);
  const primary = (roleRows?.[0]?.users ?? null) as {
    email?: string;
    language_preference?: string;
  } | null;
  const toEmail = primary?.email?.trim() || null;
  if (!toEmail) return; // no deliverable buyer address → nothing to send
  const locale = primary?.language_preference === "es" ? "es" : "en";

  // Claim the notice idempotently BEFORE sending — a conditional update that
  // only one concurrent webhook can win. If we don't claim it, someone else did.
  const { data: claimed } = await admin
    .from("email_send_audit")
    .update({ cross_party_notified_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("cross_party_notified_at", null)
    .select("id");
  if (!claimed || claimed.length === 0) return;

  const { buyerRoleToPortal } = await import("@/lib/inquiries/create-inquiry-shared");
  const buyerRole = inquiry.buyer_role === "venue" ? "venue" : "orgnz";
  const buyerPortal = buyerRoleToPortal(inquiry.buyer_role as string | null);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://evntcue.com";
  const ctaUrl = `${baseUrl}/${buyerPortal}/inquiries/${row.related_entity_id}`;

  const sentAt = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(row.sent_at));

  const { renderDeliveryFailureCrossPartyEmail } = await import(
    "@/lib/email/templates/delivery-failure"
  );
  const { sendEmail } = await import("@/lib/email/send");

  const content = renderDeliveryFailureCrossPartyEmail({
    buyerRole,
    sellerName,
    eventName,
    failedKind: "inquiry",
    bounceKind,
    sentAt,
    ctaUrl,
    locale,
  });

  const result = await sendEmail({
    to: toEmail,
    subject: content.subject,
    text: content.text,
    html: content.html,
    tags: [
      { name: "kind", value: "delivery-failure-cross-party" },
      { name: "inquiry_id", value: row.related_entity_id },
    ],
    // Buyer-recipient → NOT cross-party-eligible (guards against a notice loop).
    audit: {
      templateKind: "delivery-failure-cross-party",
      recipientTenantId: inquiry.buyer_tenant_id as string,
      relatedEntityKind: "inquiry",
      relatedEntityId: row.related_entity_id,
      payload: { locale, bounceKind },
    },
  });
  if (!result.ok) {
    console.warn(
      `resend webhook: cross-party email failed for inquiry ${row.related_entity_id}: ${result.error}`,
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "RESEND_WEBHOOK_SECRET not configured" },
      { status: 401 },
    );
  }

  const body = await request.text();
  const verified = await verifySignature(request, body, secret);
  if (!verified) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(body) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const tags = event.data.tags ?? [];
  const auditId = tags.find((t) => t.name === "email_send_audit_id")?.value ?? null;
  const notificationId = tags.find((t) => t.name === "notification_id")?.value ?? null;
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  switch (event.type) {
    case "email.delivered": {
      if (auditId) {
        await admin
          .from("email_send_audit")
          .update({ delivered_at: nowIso })
          .eq("id", auditId);
      }
      return NextResponse.json({ ok: true, handled: Boolean(auditId), type: event.type });
    }

    case "email.complained": {
      if (auditId) {
        await admin
          .from("email_send_audit")
          .update({ complained_at: nowIso })
          .eq("id", auditId);
      }
      return NextResponse.json({ ok: true, handled: Boolean(auditId), type: event.type });
    }

    case "email.delivery_delayed": {
      // Treat a delay as a soft signal: bump the tally so a sustained problem
      // can cross the cross-party threshold, but don't stamp a bounce.
      if (auditId) {
        const { data: row } = await admin
          .from("email_send_audit")
          .select("soft_bounce_count")
          .eq("id", auditId)
          .maybeSingle();
        const next = ((row?.soft_bounce_count as number | null) ?? 0) + 1;
        await admin
          .from("email_send_audit")
          .update({ delivery_delayed_at: nowIso, soft_bounce_count: next })
          .eq("id", auditId);
      }
      return NextResponse.json({ ok: true, handled: Boolean(auditId), type: event.type });
    }

    case "email.bounced": {
      const bounceKind = parseBounceKind(event.data.bounce?.type);

      // Lock 24 legacy branch (retained verbatim in spirit).
      if (notificationId) {
        await flipLock24DeliveryFailed(admin, notificationId);
      }

      // Generic audit branch + Workstream 2 cross-party trigger.
      if (auditId) {
        const { data: row } = await admin
          .from("email_send_audit")
          .select(AUDIT_COLS)
          .eq("id", auditId)
          .maybeSingle();
        if (row) {
          const typed = row as unknown as AuditRow;
          const softCount =
            bounceKind === "soft" ? (typed.soft_bounce_count ?? 0) + 1 : typed.soft_bounce_count ?? 0;
          await admin
            .from("email_send_audit")
            .update({ bounced_at: nowIso, bounce_kind: bounceKind, soft_bounce_count: softCount })
            .eq("id", auditId);
          await maybeFireCrossParty(admin, typed, bounceKind, softCount);
        }
      }

      return NextResponse.json({
        ok: true,
        handled: Boolean(auditId || notificationId),
        type: event.type,
        bounce_kind: bounceKind,
      });
    }

    default:
      return NextResponse.json({ ok: true, handled: false, type: event.type });
  }
}
