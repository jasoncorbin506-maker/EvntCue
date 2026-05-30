import "server-only";

import { Resend } from "resend";

import {
  backpatchResendId,
  recordSendAudit,
  type SendAuditArgs,
} from "./audit.ts";

/**
 * Resend SDK wrapper (Lock 24 Chunk E — Gate 5 prerequisite for the
 * `email_delivery_failed` flag from UX critique pass #2.4).
 *
 * Env vars required:
 *   - RESEND_API_KEY — production token from resend.com dashboard.
 *     Per Hard Rule #9: never substring-print env values; just check
 *     for presence and fail clean if missing.
 *
 * Sender address: noreply@evntcue.com (already verified per Lock 24
 * entry pre-flight; Supabase Auth uses the same domain). Future
 * transactional emails (post-booking confirmations, payout receipts,
 * etc.) can route through this same wrapper.
 *
 * Design note: this module deliberately stays narrow — `sendEmail()`
 * takes structured args, NOT raw Resend payloads. Keeps call sites
 * portable if we ever swap providers.
 */

export type SendEmailArgs = {
  to: string;
  subject: string;
  /** Plain-text body. Required (deliverability baseline). */
  text: string;
  /** Optional HTML body. Recipients with rich-text clients see this. */
  html?: string;
  /**
   * Optional Resend tag for analytics + webhook routing. Use the form
   * `lock-24:date-change-notification` to group related sends.
   */
  tags?: ReadonlyArray<{ name: string; value: string }>;
  /**
   * Optional delivery-audit context (Phase 3). When present, `sendEmail` writes
   * an `email_send_audit` row before the Resend call, tags the send with
   * `email_send_audit_id`, and back-patches the Resend message id on success —
   * so the webhook can stamp delivery/bounce/complaint state onto the row. The
   * recipient email is taken from `to`. Omit for sends that don't need tracking.
   */
  audit?: Omit<SendAuditArgs, "recipientEmail" | "admin">;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

let cachedClient: Resend | null = null;

function client(): Resend | null {
  if (cachedClient) return cachedClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cachedClient = new Resend(key);
  return cachedClient;
}

/**
 * Send a transactional email via Resend. Returns `ok: false` with a clean
 * error if RESEND_API_KEY isn't set OR if the Resend call fails — caller
 * decides whether to retry, log, or surface to the user.
 *
 * Caller MUST handle the failure case explicitly; per Lock 22 we never
 * silently swallow email failures (a missing notification email is the
 * symptom UX critique #2.4 added the `email_delivery_failed` flag for).
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const c = client();
  if (!c) {
    return {
      ok: false,
      error: "RESEND_API_KEY is not configured — email not sent.",
    };
  }

  // Delivery-audit row first (Phase 3). Best-effort: a null id just means the
  // send proceeds untagged and isn't delivery-tracked — never blocks the send.
  const auditId = args.audit
    ? await recordSendAudit({ ...args.audit, recipientEmail: args.to })
    : null;

  const tags = auditId
    ? [...(args.tags ?? []), { name: "email_send_audit_id", value: auditId }]
    : args.tags;

  try {
    const result = await c.emails.send({
      from: "EvntCue <noreply@evntcue.com>",
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
      tags: tags as Array<{ name: string; value: string }> | undefined,
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    if (!result.data?.id) {
      return { ok: false, error: "Resend returned no message id" };
    }
    if (auditId) {
      await backpatchResendId(auditId, result.data.id);
    }
    return { ok: true, id: result.data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Resend send threw: ${message}` };
  }
}
