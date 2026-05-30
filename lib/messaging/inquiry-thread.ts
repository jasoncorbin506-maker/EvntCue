import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  InquiryMessage,
  InquirySenderRole,
  InquiryThreadView,
} from "@/lib/messaging/inquiry-thread-shared";

/**
 * Server-side reads for inquiry_messages (mig 058 shipped the table; mig 061
 * widened it to a polymorphic `(inquiry_table, inquiry_id)` key per the
 * Option B inquiry-primitive direction). Every query here filters
 * `inquiry_table = 'inquiries'` — the plnr_engagements branch is
 * scaffolded in the schema CHECK but not yet wired through the messaging UX.
 *
 * RLS gates both vendor + buyer access via per-verb tenant pattern from
 * mig 061 — vendor reads via inquiry.recipient_tenant_id; buyer reads via
 * inquiry.buyer_tenant_id (works for both 'orgnz' and 'venue' buyers, and
 * doesn't depend on event_id, which is nullable for venue-buyer inquiries).
 * Helpers below trust RLS — no app-layer ownership re-check beyond what the
 * migration encodes.
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
    .eq("inquiry_table", "inquiries")
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
 * Drives the bottom-nav badge on /vndr/inquiries. Counts buyer-side
 * messages — sender_role IN ('orgnz', 'venue') — with read_at IS NULL.
 *
 * RLS gates the read — the vendor only sees messages on inquiries where
 * inquiry.recipient_tenant_id matches their tenant.
 */
export async function getUnreadCountForVendor(
  vendorTenantId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("inquiry_messages")
    .select("id", { count: "exact", head: true })
    .eq("inquiry_table", "inquiries")
    .in("sender_role", ["orgnz", "venue"])
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
 * Total unread message count for a buyer (orgnz or venue) across all their
 * inquiries. Drives the bottom-nav badge on /orgnz/inquiries and the future
 * /venu/inquiries badge. Counts vendor-side messages (sender_role = 'vndr')
 * with read_at IS NULL.
 *
 * Inquiries are resolved by direct buyer_tenant_id match — mig 059 means
 * both org and venue buyers route through the same column.
 */
export async function getUnreadCountForBuyer(
  buyerTenantId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("inquiry_messages")
    .select("id", { count: "exact", head: true })
    .eq("inquiry_table", "inquiries")
    .eq("sender_role", "vndr")
    .is("read_at", null)
    .in("inquiry_id", await getBuyerInquiryIds(buyerTenantId));
  return count ?? 0;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function getVendorInquiryIds(vendorTenantId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select("id")
    .eq("recipient_tenant_id", vendorTenantId);
  return (data ?? []).map((r) => (r as Record<string, unknown>).id as string);
}

async function getBuyerInquiryIds(
  buyerTenantId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select("id")
    .eq("buyer_tenant_id", buyerTenantId);
  return (data ?? []).map((r) => (r as Record<string, unknown>).id as string);
}
