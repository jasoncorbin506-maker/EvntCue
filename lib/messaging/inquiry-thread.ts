import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  InquiryMessage,
  InquirySenderRole,
  InquiryThreadView,
} from "@/lib/messaging/inquiry-thread-shared";

/**
 * Server-side reads for inquiry_messages (migration 058, V-2c Session 1).
 *
 * RLS gates both vendor + organizer access via per-verb tenant pattern from
 * the migration — vendor reads via inquiry.vndr_tenant_id ownership;
 * organizer reads via user_owns_event(inquiry.event_id). Both helpers below
 * just trust RLS — no app-layer ownership re-check beyond what the migration
 * encodes.
 *
 * Type definitions live in inquiry-thread-shared.ts so Client Components can
 * import them without dragging "server-only" into the browser bundle.
 */

export type {
  InquiryMessage,
  InquirySenderRole,
  InquiryThreadView,
} from "@/lib/messaging/inquiry-thread-shared";

const MSG_COLS =
  "id, inquiry_id, sender_user_id, sender_tenant_id, sender_role, body, read_at, created_at";

function shape(row: Record<string, unknown>): InquiryMessage {
  return {
    id: row.id as string,
    inquiryId: row.inquiry_id as string,
    senderUserId: row.sender_user_id as string,
    senderTenantId: row.sender_tenant_id as string,
    senderRole: row.sender_role as InquirySenderRole,
    body: row.body as string,
    readAt: (row.read_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

/**
 * Fetch the full message thread for a single inquiry, ordered oldest-first
 * (natural reading order in the UI). RLS gates the caller's access — if
 * the caller can't see the inquiry's messages, this returns an empty array
 * (not an error, since RLS-filtered rows just don't appear in the result).
 *
 * `viewerRole` parameter is used to compute the unreadFromCounterparty
 * count — the viewer cares about messages from the OTHER party that
 * haven't been marked read yet.
 */
export async function getInquiryThread(
  inquiryId: string,
  viewerRole: InquirySenderRole,
): Promise<InquiryThreadView> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiry_messages")
    .select(MSG_COLS)
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });

  const messages = (data ?? []).map((r) => shape(r as Record<string, unknown>));
  const unreadFromCounterparty = messages.filter(
    (m) => m.senderRole !== viewerRole && m.readAt === null,
  ).length;

  return {
    inquiryId,
    messages,
    unreadFromCounterparty,
  };
}

/**
 * Total unread message count for a vendor across all their inquiries.
 * Drives the bottom-nav badge on /vndr/inquiries. Counts only messages
 * sent by the OTHER party (sender_role = 'orgnz') with read_at IS NULL.
 *
 * RLS gates the read — the vendor only sees messages on inquiries where
 * inquiry.vndr_tenant_id matches their tenant.
 */
export async function getUnreadCountForVendor(
  vendorTenantId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("inquiry_messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_role", "orgnz")
    .is("read_at", null)
    .in(
      "inquiry_id",
      // Subquery via PostgREST: only inquiries this vendor owns.
      // Done as a separate query rather than .in() with an inline subquery
      // because PostgREST doesn't support correlated subqueries in .in().
      await getVendorInquiryIds(vendorTenantId),
    );
  return count ?? 0;
}

/**
 * Total unread message count for an organizer across all their inquiries.
 * Drives the bottom-nav badge on /orgnz/inquiries. Counts only messages
 * sent by the OTHER party (sender_role = 'vndr') with read_at IS NULL.
 *
 * Inquiries are resolved through event ownership rather than direct tenant
 * filter — organizers own events, events have inquiries.
 */
export async function getUnreadCountForOrganizer(
  organizerTenantId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("inquiry_messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_role", "vndr")
    .is("read_at", null)
    .in("inquiry_id", await getOrganizerInquiryIds(organizerTenantId));
  return count ?? 0;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function getVendorInquiryIds(vendorTenantId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_inquiries")
    .select("id")
    .eq("vndr_tenant_id", vendorTenantId);
  return (data ?? []).map((r) => (r as Record<string, unknown>).id as string);
}

async function getOrganizerInquiryIds(
  organizerTenantId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_inquiries")
    .select("id")
    .eq("orgnz_tenant_id", organizerTenantId);
  return (data ?? []).map((r) => (r as Record<string, unknown>).id as string);
}
