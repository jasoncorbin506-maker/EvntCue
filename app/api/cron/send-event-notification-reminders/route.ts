import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { renderReminderEmail } from "@/lib/email/templates/event-notifications";
import {
  NOTIFICATION_REMINDER_DAYS,
  type DateChangePayload,
} from "@/lib/events/event-notifications-shared";

/**
 * Hourly Vercel cron worker — sends the day-7 reminder email for pending
 * date-change notifications. Schedule defined in vercel.json:
 * `0 * * * *`. Lock 24 Q3 ("14d flat with a reminder at day 7").
 *
 * Auth: Vercel cron requests carry `Authorization: Bearer <CRON_SECRET>`.
 * Without that header we 401. Hard Rule #9 — never substring-print env
 * values; presence check only.
 *
 * Idempotency: the WHERE clause filters on `reminder_sent_at IS NULL`,
 * and the per-row UPDATE stamps `reminder_sent_at = now()` immediately
 * after the email send (or attempted send). If the cron fires twice in
 * a window, the second invocation sees zero matching rows and exits.
 *
 * Failure handling: if Resend rejects the send (bad address, rate limit,
 * etc.), we still stamp `reminder_sent_at` so we don't loop forever on
 * a bad row. The Resend bounce webhook (Lock 24 UX critique #2.4) flips
 * `payload.email_delivery_failed = true` so the orgnz feed card can
 * surface "we couldn't reach this Vndr by email" — that's a separate
 * UX signal, not a cron retry trigger.
 */

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoffIso = new Date(
    Date.now() - NOTIFICATION_REMINDER_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: rows, error } = await admin
    .from("event_notifications")
    .select(
      `
      id,
      vendor_tenant_id,
      payload,
      created_at,
      events ( name )
    `,
    )
    .eq("type", "date_change")
    .eq("vendor_response", "pending")
    .is("reminder_sent_at", null)
    .is("superseded_by", null)
    .lt("created_at", cutoffIso);

  if (error) {
    return NextResponse.json(
      { ok: false, error: `event_notifications scan failed: ${error.message}` },
      { status: 500 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://evntcue.com";
  const nowIso = new Date().toISOString();
  const summary = {
    scanned: rows?.length ?? 0,
    sent: 0,
    skippedNoEmail: 0,
    sendFailures: 0 as number,
    failures: [] as Array<{ id: string; error: string }>,
  };

  for (const row of rows ?? []) {
    const notificationId = row.id as string;
    const eventJoin = (row.events ?? {}) as { name?: string };
    const eventName = eventJoin.name ?? "your event";
    const payload = (row.payload ?? {}) as DateChangePayload;

    // Resolve the primary vendor user's email + locale via user_roles → users.
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("user_id, users!inner ( email, language_preference )")
      .eq("tenant_id", row.vendor_tenant_id as string)
      .in("role", ["vndr", "catr"])
      .eq("is_primary", true)
      .maybeSingle();

    const userJoin = (roleRow?.users ?? {}) as {
      email?: string;
      language_preference?: string;
    };
    const email = userJoin.email ?? null;
    const locale = userJoin.language_preference === "es" ? "es" : "en";

    if (!email) {
      summary.skippedNoEmail += 1;
      continue;
    }

    const detailUrl = `${baseUrl}/vndr/inquiries/date-change/${notificationId}`;
    const content = renderReminderEmail({
      eventName,
      payload,
      detailUrl,
      locale,
    });

    const sendResult = await sendEmail({
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      tags: [
        { name: "lock", value: "24" },
        { name: "kind", value: "date-change-reminder" },
        { name: "notification_id", value: notificationId },
      ],
    });

    // Stamp reminder_sent_at regardless of send outcome — see header
    // comment for the "don't loop on bad rows" rationale. Send failures
    // are logged for observability + accounted in the response summary.
    const { error: stampErr } = await admin
      .from("event_notifications")
      .update({ reminder_sent_at: nowIso })
      .eq("id", notificationId);

    if (stampErr) {
      summary.failures.push({
        id: notificationId,
        error: `reminder_sent_at stamp failed: ${stampErr.message}`,
      });
      continue;
    }

    if (sendResult.ok) {
      summary.sent += 1;
    } else {
      summary.sendFailures += 1;
      summary.failures.push({ id: notificationId, error: sendResult.error });
    }
  }

  return NextResponse.json({ ok: true, summary });
}
