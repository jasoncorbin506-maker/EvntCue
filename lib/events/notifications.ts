import "server-only";

/**
 * Event-notification write path (Lock 24 Chunk B).
 *
 * Schema source-of-record: `00_Live/deploy/068_event_notifications.sql` (Chunk A).
 * Types: `./event-notifications-shared.ts` (client-safe; this module is
 * server-only).
 *
 * Responsibilities:
 *   1. Query active bookings on an event whose vendors need to know about a
 *      change.
 *   2. Write notification rows + supersede any prior pending rows for the
 *      same (event_id, vendor_tenant_id) pair.
 *
 * NOT this module:
 *   - Vndr-side accept/decline server actions — Chunk C
 *   - Orgnz-side feed surfaces — Chunk D
 *   - Cron expiry + day-7 reminder + email + Resend wiring — Chunk E
 *
 * Atomicity note: Supabase JS doesn't expose a `.transaction()` API. True
 * atomic supersession (INSERT + UPDATE in one TX) would require a
 * SECURITY DEFINER Postgres function (= a new migration, out of Chunk B
 * scope per the brief). The ordered sequence below is self-healing — if
 * step 2 (supersession UPDATE) fails after step 1 (INSERT) succeeds, the
 * worst case is two pending rows for the same vendor, which the next
 * supersession cleans up. Step-1 failure leaves no state change.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { renderInitialNotificationEmail } from "@/lib/email/templates/event-notifications";

import type {
  CancellationPayload,
  DateChangePayload,
  TimeChangePayload,
} from "./event-notifications-shared";

// =============================================================================
// Public types
// =============================================================================

/**
 * One booking that should receive a notification for an event-level change.
 * `bookingId` populates `event_notifications.booking_id` (the join shortcut
 * column added in Chunk A).
 */
export type ActiveBookingForNotification = {
  bookingId: string;
  vendorTenantId: string;
};

/**
 * Discriminated union of all writable notification shapes. Narrows the
 * `payload` JSONB column at the call site, so a `date_change` write can't
 * accidentally ship a `cancellation` shape.
 *
 * Chunk B's V1 emitter (cascade-preview) only produces `date_change`; the
 * other variants are reserved for Chunks D/E and beyond. The schema's
 * CHECK constraint on `type` rejects anything outside this union.
 */
export type WriteEventNotificationInput =
  | { type: "date_change"; data: DateChangePayload }
  | { type: "time_change"; data: TimeChangePayload }
  | { type: "cancellation"; data: CancellationPayload };

export type WriteEventNotificationResult =
  | { ok: true; insertedIds: string[] }
  | { ok: false; error: string };

// =============================================================================
// Active-bookings query
// =============================================================================

/**
 * Bookings whose vendors should be notified when an event-level change
 * commits. Excludes terminal-cancelled states (`cancelled`, `disputed`) and
 * already-completed bookings (`completed`) — sending a "date moved" alert to
 * a vendor whose booking is already done or cancelled is confusing UX.
 *
 * Includes `cancellation_requested` (per Chunk B brief): the vendor has
 * requested cancellation but the booking is still in flux; if the orgnz
 * changes the date in parallel, the vendor still needs to know — accepting
 * the new date is a valid resolution to a pending cancellation request.
 *
 * Lock 22 (warnings inform, never block) — when in doubt, notify.
 */
const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "pending_venue_lock",
  "confirmed",
  "cancellation_requested",
] as const;

export async function findActiveBookingsForNotification(
  eventId: string,
  admin: SupabaseClient = createAdminClient(),
): Promise<ActiveBookingForNotification[]> {
  const { data, error } = await admin
    .from("bookings")
    .select("id, vndr_tenant_id")
    .eq("event_id", eventId)
    .in("status", ACTIVE_BOOKING_STATUSES as unknown as string[]);

  if (error) {
    console.warn(
      `findActiveBookingsForNotification(${eventId}): ${error.message}`,
    );
    return [];
  }
  if (!data) return [];

  // Dedupe defensively — a single vendor could in theory hold multiple
  // bookings on the same event (e.g., separate ceremony + reception
  // bookings). The notification fires once per (booking, vendor) pair;
  // callers that want one notification per vendor regardless of booking
  // count should dedupe by vendor_tenant_id at the call site.
  const seen = new Set<string>();
  const result: ActiveBookingForNotification[] = [];
  for (const row of data) {
    const key = `${row.id}:${row.vndr_tenant_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      bookingId: row.id as string,
      vendorTenantId: row.vndr_tenant_id as string,
    });
  }
  return result;
}

// =============================================================================
// Write + supersede
// =============================================================================

/**
 * Write event notifications for a set of bookings, superseding any prior
 * pending notifications for the same (event_id, vendor_tenant_id) pair.
 *
 * Per-vendor scoping is intentional: if Vendor A already responded
 * `accepted` and Vendor B is still `pending`, only B's prior row gets
 * superseded on a re-commit. Vendor A's `accepted` row stays as-is and a
 * new `pending` row is inserted for the new date — Vendor A re-confirms or
 * declines independently. (Lock 24 entry, Pass 2 row #2.)
 *
 * Empty bookings list → no-op (Chunk B brief Q4 disposition: skip-write
 * when nothing to notify). Returns `ok: true` with empty `insertedIds`.
 *
 * Atomicity caveat: see top-of-file note. Step-2 (supersession UPDATE)
 * failure is logged but doesn't fail the call — the new pending row is
 * already durable and the next supersession will clean up any orphan
 * prior pendings.
 */
export async function writeEventNotification(args: {
  eventId: string;
  bookings: ActiveBookingForNotification[];
  notification: WriteEventNotificationInput;
  admin?: SupabaseClient;
}): Promise<WriteEventNotificationResult> {
  if (args.bookings.length === 0) {
    return { ok: true, insertedIds: [] };
  }

  const admin = args.admin ?? createAdminClient();

  // -------------------------------------------------------------------------
  // 1. Bulk INSERT new pending rows (one per (booking, vendor))
  // -------------------------------------------------------------------------
  const rowsToInsert = args.bookings.map((b) => ({
    event_id: args.eventId,
    vendor_tenant_id: b.vendorTenantId,
    booking_id: b.bookingId,
    type: args.notification.type,
    payload: args.notification.data,
  }));

  const { data: inserted, error: insertErr } = await admin
    .from("event_notifications")
    .insert(rowsToInsert)
    .select("id, vendor_tenant_id");

  if (insertErr || !inserted) {
    return {
      ok: false,
      error: `event_notifications insert failed: ${insertErr?.message ?? "no rows returned"}`,
    };
  }

  // -------------------------------------------------------------------------
  // 2. Supersede prior pending rows per vendor
  //
  // For each new row, mark any older pending row for the same
  // (event_id, vendor_tenant_id) as expired with superseded_by → new row's
  // id and resolved_at = now() (Chunk B Q2 disposition).
  // -------------------------------------------------------------------------
  const nowIso = new Date().toISOString();
  for (const newRow of inserted) {
    const { error: updateErr } = await admin
      .from("event_notifications")
      .update({
        vendor_response: "expired",
        superseded_by: newRow.id,
        resolved_at: nowIso,
      })
      .eq("event_id", args.eventId)
      .eq("vendor_tenant_id", newRow.vendor_tenant_id)
      .eq("vendor_response", "pending")
      .neq("id", newRow.id);

    if (updateErr) {
      // Self-healing: leave the orphan pending row(s). Next supersession
      // cleans them up. Log for observability — high cardinality of this
      // warning would indicate a real problem (DB latency, RLS regression).
      console.warn(
        `event_notifications supersession warning for vendor ${newRow.vendor_tenant_id} on event ${args.eventId}: ${updateErr.message}`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // 3. Initial-notification emails (Lock 24 Chunk E)
  //
  // Fire-and-forget per row. Failures are logged for observability but
  // don't fail the cascade — the in-app card is already durable; missed
  // emails surface via the orgnz feed once we wire `email_delivery_failed`
  // display in a follow-up. RESEND_API_KEY absence is treated as a soft
  // skip so dev environments without the key still work for in-app testing.
  // -------------------------------------------------------------------------
  if (args.notification.type === "date_change") {
    const payload = args.notification.data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://evntcue.com";

    // Fetch event name (one query — cheap) + per-vendor primary user
    // email/locale (one query, joined).
    const { data: eventRow } = await admin
      .from("events")
      .select("name")
      .eq("id", args.eventId)
      .maybeSingle();
    const eventName = (eventRow?.name as string | null) ?? "your event";

    const vendorIds = inserted.map((r) => r.vendor_tenant_id as string);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("tenant_id, users!inner ( email, language_preference )")
      .in("tenant_id", vendorIds)
      .in("role", ["vndr", "catr"])
      .eq("is_primary", true);

    const emailByTenant = new Map<
      string,
      { email: string; locale: "en" | "es" }
    >();
    for (const r of roleRows ?? []) {
      const u = (r.users ?? {}) as {
        email?: string;
        language_preference?: string;
      };
      if (u.email) {
        emailByTenant.set(r.tenant_id as string, {
          email: u.email,
          locale: u.language_preference === "es" ? "es" : "en",
        });
      }
    }

    for (const newRow of inserted) {
      const tenantId = newRow.vendor_tenant_id as string;
      const target = emailByTenant.get(tenantId);
      if (!target) continue; // primary user without email; cron reminder will retry the lookup

      const detailUrl = `${baseUrl}/vndr/inquiries/date-change/${newRow.id}`;
      const content = renderInitialNotificationEmail({
        eventName,
        payload,
        detailUrl,
        locale: target.locale,
      });
      const result = await sendEmail({
        to: target.email,
        subject: content.subject,
        text: content.text,
        html: content.html,
        tags: [
          { name: "lock", value: "24" },
          { name: "kind", value: "date-change-initial" },
          { name: "notification_id", value: newRow.id as string },
        ],
      });
      if (!result.ok) {
        console.warn(
          `event_notifications initial email failed for ${tenantId} on ${args.eventId}: ${result.error}`,
        );
      }
    }
  }

  return {
    ok: true,
    insertedIds: inserted.map((r) => r.id as string),
  };
}
