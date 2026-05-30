import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Email send-skip sink (Phase 2 — booking lifecycle).
 *
 * Phase 2 wires an activation-gate defensive check at every send-call site: an
 * inquiry/decline email that would fire on a non-active event (Lock 27) is
 * skipped. Per the Phase 2 brief, a skipped send must NOT be silent — otherwise
 * "why didn't this email fire?" is undebuggable. `logSkippedSend` records the
 * skip to `email_send_skips` (migration 074).
 *
 * Deliberately narrow + separate from Phase 3's planned `email_send_audit`
 * delivery tracker: that records actual sends + Resend delivery state. A skip is
 * a non-send, so it gets its own table rather than the send-audit one.
 *
 * Write path is the service-role admin client (the table is RLS-enabled with no
 * policies — service-role only). This helper NEVER throws and never blocks the
 * caller: a write failure (including the table not existing yet, before
 * migration 074 is applied) is swallowed with a console.warn. That keeps the
 * app deploy and the migration order-independent.
 */

/** Templates that can record a skipped send. */
export type EmailSkipTemplate =
  | "inquiry-received"
  | "booking-confirmed"
  | "decline";

/** Why a send was skipped. Currently only the Lock 27 activation gate. */
export type EmailSkipReason = "event_not_active";

export async function logSkippedSend(args: {
  template: EmailSkipTemplate;
  reason: EmailSkipReason;
  eventId?: string | null;
  inquiryId?: string | null;
  recipientTenantId?: string | null;
  /** Reuse a caller's admin client; defaults to a fresh one. */
  admin?: SupabaseClient;
}): Promise<void> {
  try {
    const admin = args.admin ?? createAdminClient();
    const { error } = await admin.from("email_send_skips").insert({
      template: args.template,
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
