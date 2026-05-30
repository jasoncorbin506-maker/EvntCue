import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Email send-audit sinks.
 *
 * Two distinct tables, two distinct facts:
 *
 *   - `email_send_skips` (migration 074) — sends we deliberately did NOT make
 *     (Lock 27 activation-gate skips). A non-send: no Resend id, no delivery
 *     lifecycle. Written by `logSkippedSend`.
 *   - `email_send_audit` (migration 075, Phase 3) — sends we DID make, with
 *     their delivery lifecycle (sent / delivered / bounced / complained).
 *     Written by `recordSendAudit` (insert before the Resend call) +
 *     `backpatchResendId` (stamp the Resend message id from the response).
 *
 * Both write via the service-role admin client (both tables are RLS-enabled
 * with no policies — service-role only). Every helper here NEVER throws and
 * never blocks the caller: an audit-write failure — including the table not
 * existing yet, before its migration is applied — is swallowed with a
 * console.warn. That keeps the app deploy and the migrations order-independent.
 */

/** Templates that can record a skipped send. */
export type EmailAuditTemplate =
  | "inquiry-received"
  | "booking-confirmed"
  | "decline"
  | "delivery-failure-cross-party";

/** Why a send was skipped. Currently only the Lock 27 activation gate. */
export type EmailSkipReason = "event_not_active";

export async function logSkippedSend(args: {
  template: EmailAuditTemplate;
  reason: EmailSkipReason;
  eventId?: string | null;
  inquiryId?: string | null;
  recipientTenantId?: string | null;
  /** Reuse a caller's admin client; defaults to a fresh one. */
  admin?: SupabaseClient;
}): Promise<void> {
  try {
    const admin = args.admin ?? createAdminClient();
    const { error } = await admin.from("email_send_audit").insert({
      template: args.template,
      outcome: "skipped",
      reason: args.reason,
      event_id: args.eventId ?? null,
      inquiry_id: args.inquiryId ?? null,
      recipient_tenant_id: args.recipientTenantId ?? null,
    });
    if (error) {
      console.warn(
        `logSkippedSend(${args.template}/${args.reason}): ${error.message}`,
      );
    }
  } catch (e) {
    console.warn(`logSkippedSend(${args.template}/${args.reason}) threw: ${String(e)}`);
  }
}

// ── email_send_audit (migration 075, Phase 3 delivery tracker) ───────────────

/** The thing an email was about — polymorphic backref (no FK; mixed kinds). */
export type RelatedEntityKind =
  | "inquiry"
  | "booking"
  | "user"
  | "event_notification";

export type SendAuditArgs = {
  /** 'welcome' | 'verify' | 'inquiry-received' | 'decline' | … */
  templateKind: string;
  recipientEmail: string;
  recipientTenantId?: string | null;
  relatedEntityKind?: RelatedEntityKind | null;
  relatedEntityId?: string | null;
  /** Template params + locale + portal at send time (debug / re-render aid). */
  payload?: Record<string, unknown>;
  /** Reuse a caller's admin client; defaults to a fresh one. */
  admin?: SupabaseClient;
};

/**
 * Insert a delivery-audit row BEFORE the Resend call and return its id, so the
 * caller can tag the Resend send with `email_send_audit_id = <id>`. Returns
 * null on any failure (table absent, write error) — the send proceeds untagged
 * and simply isn't delivery-tracked. Never throws.
 */
export async function recordSendAudit(args: SendAuditArgs): Promise<string | null> {
  try {
    const admin = args.admin ?? createAdminClient();
    const { data, error } = await admin
      .from("email_send_audit")
      .insert({
        template_kind: args.templateKind,
        recipient_email: args.recipientEmail,
        recipient_tenant_id: args.recipientTenantId ?? null,
        related_entity_kind: args.relatedEntityKind ?? null,
        related_entity_id: args.relatedEntityId ?? null,
        payload: args.payload ?? {},
      })
      .select("id")
      .single();
    if (error) {
      console.warn(`recordSendAudit(${args.templateKind}): ${error.message}`);
      return null;
    }
    return (data?.id as string) ?? null;
  } catch (e) {
    console.warn(`recordSendAudit(${args.templateKind}) threw: ${String(e)}`);
    return null;
  }
}

/** Stamp the Resend message id onto an audit row after a successful send. */
export async function backpatchResendId(
  auditId: string,
  resendEmailId: string,
  admin?: SupabaseClient,
): Promise<void> {
  try {
    const a = admin ?? createAdminClient();
    const { error } = await a
      .from("email_send_audit")
      .update({ resend_email_id: resendEmailId })
      .eq("id", auditId);
    if (error) {
      console.warn(`backpatchResendId(${auditId}): ${error.message}`);
    }
  } catch (e) {
    console.warn(`backpatchResendId(${auditId}) threw: ${String(e)}`);
  }
}
