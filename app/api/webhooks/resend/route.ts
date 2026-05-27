import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resend webhook — listens for `email.bounced` events on transactional
 * sends and flips `event_notifications.payload.email_delivery_failed = true`
 * for the matching row. Per Lock 24 UX critique #2.4:
 *
 *   "Track Resend webhook bounces on the day-7 reminder send. If bounced,
 *    set event_notifications.payload.email_delivery_failed = true. Orgnz
 *    EXPIRED card surfaces it: 'We couldn't reach [Vendor] by email
 *    (delivery failed). You may want to contact them directly.'"
 *
 * Auth: Resend signs webhook payloads with a shared secret
 * (RESEND_WEBHOOK_SECRET). Per Hard Rule #9 — presence check on the
 * header; signature verification uses constant-time comparison via
 * Web Crypto. Without the secret env var, the route 401s every request
 * (safe default).
 *
 * Notification matching: outgoing sends are tagged with
 * `{ name: "notification_id", value: <uuid> }` (see
 * lib/email/templates/event-notifications.ts callers). The webhook
 * payload includes those tags; we read the notification_id tag and
 * patch the matching row's payload JSONB.
 *
 * Idempotent: the JSONB patch is a SET on a single key, so duplicate
 * bounce events for the same notification just rewrite the same `true`.
 */

type ResendWebhookEvent = {
  type: string; // "email.bounced", "email.complained", "email.delivered", etc.
  data: {
    email_id?: string;
    tags?: Array<{ name: string; value: string }>;
    bounce?: { type?: string; message?: string };
  };
};

async function verifySignature(
  request: Request,
  body: string,
  secret: string,
): Promise<boolean> {
  // Resend uses HMAC-SHA256 on the raw body with the webhook secret.
  // Header: `resend-signature: <hex>`.
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

  // Constant-time compare. Both strings same length here (sha256 hex = 64).
  if (sigHex.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < sigHex.length; i += 1) {
    diff |= sigHex.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
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
    return NextResponse.json(
      { ok: false, error: "Invalid signature" },
      { status: 401 },
    );
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(body) as ResendWebhookEvent;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // We only care about delivery failures. Complaints + delivered events
  // we acknowledge without action (so Resend stops retrying the webhook).
  if (event.type !== "email.bounced") {
    return NextResponse.json({ ok: true, handled: false, type: event.type });
  }

  const tags = event.data.tags ?? [];
  const notificationTag = tags.find((t) => t.name === "notification_id");
  if (!notificationTag) {
    return NextResponse.json({
      ok: true,
      handled: false,
      reason: "no notification_id tag — not a Lock 24 send",
    });
  }

  // Patch payload.email_delivery_failed = true on the matching row.
  //
  // Supabase JS doesn't expose Postgres's `jsonb || jsonb` merge operator
  // directly. The cleanest path without an RPC is read-modify-write:
  // load the current payload, merge the new flag, write the union back.
  // The race window is minor — bounce webhooks for a single notification
  // are very low frequency.
  const admin = createAdminClient();
  const { data: row, error: readErr } = await admin
    .from("event_notifications")
    .select("payload")
    .eq("id", notificationTag.value)
    .maybeSingle();
  if (readErr) {
    return NextResponse.json(
      { ok: false, error: `payload read failed: ${readErr.message}` },
      { status: 500 },
    );
  }
  if (!row) {
    // Notification was deleted (cascade) or never existed. Acknowledge
    // and return — nothing to patch.
    return NextResponse.json({
      ok: true,
      handled: false,
      reason: "notification not found",
    });
  }

  const current = (row.payload ?? {}) as Record<string, unknown>;
  const merged = { ...current, email_delivery_failed: true };
  const { error: writeErr } = await admin
    .from("event_notifications")
    .update({ payload: merged })
    .eq("id", notificationTag.value);
  if (writeErr) {
    return NextResponse.json(
      { ok: false, error: `payload patch failed: ${writeErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    handled: true,
    notification_id: notificationTag.value,
  });
}
