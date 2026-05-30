import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  VendorDetail,
  VendorNotificationSummary,
} from "@/lib/orgnz/vendor-detail-shared";

export type {
  VendorBookingSummary,
  VendorDetail,
  VendorNotificationSummary,
} from "@/lib/orgnz/vendor-detail-shared";

/**
 * Per-vendor detail powering the orgnz dashboard's VendorDetailSheet —
 * booking summary + latest Lock 24 notification status + the inquiry
 * thread id (if any) for Quick connect deep-linking.
 *
 * Returns a Map keyed by vndr_tenant_id so RunOfShow can pluck the slice
 * matching whichever presence row the user taps. RLS scopes everything
 * to events the orgnz owns; the joins below are all under that gate.
 *
 * Empty Map on any error so the sheet falls back to "no booking on file"
 * rather than 500ing the dashboard.
 */
export async function getOrgnzVendorDetailsForEvent(
  eventId: string,
  orgnzTenantId: string,
): Promise<Map<string, VendorDetail>> {
  const supabase = await createClient();

  const [bookingsRes, notifsRes, inquiriesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, vndr_tenant_id, status, total_cents, deposit_pct, confirmed_at, vndr_packages ( name, price_cents )",
      )
      .eq("event_id", eventId),
    supabase
      .from("event_notifications")
      .select("id, vendor_tenant_id, vendor_response, payload, created_at")
      .eq("event_id", eventId)
      .eq("type", "date_change")
      .is("superseded_by", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("inquiries")
      .select("id, recipient_tenant_id, created_at")
      .eq("buyer_tenant_id", orgnzTenantId)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
  ]);

  const bookings = (bookingsRes.data ?? []) as Record<string, unknown>[];
  const notifs = (notifsRes.data ?? []) as Record<string, unknown>[];
  const inquiries = (inquiriesRes.data ?? []) as Record<string, unknown>[];

  const vndrTenantIds = Array.from(
    new Set(bookings.map((b) => b.vndr_tenant_id as string)),
  );
  const vendorsRes = vndrTenantIds.length
    ? await supabase
        .from("vendors")
        .select("tenant_id, display_name, primary_category, contact_email")
        .in("tenant_id", vndrTenantIds)
    : { data: [] };
  const vendors = (vendorsRes.data ?? []) as Record<string, unknown>[];

  const byTenant = new Map<string, VendorDetail>();
  function getOrInit(vt: string): VendorDetail {
    let d = byTenant.get(vt);
    if (!d) {
      d = {
        vndrTenantId: vt,
        displayName: null,
        primaryCategory: null,
        contactEmail: null,
        booking: null,
        latestNotification: null,
        inquiryThreadId: null,
      };
      byTenant.set(vt, d);
    }
    return d;
  }

  for (const v of vendors) {
    const detail = getOrInit(v.tenant_id as string);
    detail.displayName = (v.display_name as string | null) ?? null;
    detail.primaryCategory = (v.primary_category as string | null) ?? null;
    detail.contactEmail = (v.contact_email as string | null) ?? null;
  }

  for (const b of bookings) {
    const detail = getOrInit(b.vndr_tenant_id as string);
    const pkg = (b.vndr_packages ?? {}) as Record<string, unknown>;
    detail.booking = {
      bookingId: b.id as string,
      status: (b.status as string) ?? "pending",
      packageName: (pkg.name as string | null) ?? null,
      packagePriceCents: (pkg.price_cents as number | null) ?? null,
      totalCents: (b.total_cents as number | null) ?? 0,
      depositPct: Number(b.deposit_pct ?? 0),
      confirmedAt: (b.confirmed_at as string | null) ?? null,
    };
  }

  // notifs already ordered DESC — first hit per vendor is "latest"
  const seenNotif = new Set<string>();
  for (const n of notifs) {
    const vt = n.vendor_tenant_id as string;
    if (seenNotif.has(vt)) continue;
    seenNotif.add(vt);
    const detail = byTenant.get(vt);
    if (!detail) continue;
    const payload = (n.payload ?? {}) as Record<string, unknown>;
    const summary: VendorNotificationSummary = {
      id: n.id as string,
      response: n.vendor_response as VendorNotificationSummary["response"],
      oldStartDate: (payload.oldStartDate as string | null) ?? null,
      newStartDate: (payload.newStartDate as string | null) ?? null,
      emailDeliveryFailed: payload.email_delivery_failed === true,
      createdAt: n.created_at as string,
    };
    detail.latestNotification = summary;
  }

  const seenInq = new Set<string>();
  for (const i of inquiries) {
    const vt = i.recipient_tenant_id as string;
    if (seenInq.has(vt)) continue;
    seenInq.add(vt);
    const detail = byTenant.get(vt);
    if (detail) detail.inquiryThreadId = i.id as string;
  }

  return byTenant;
}
