import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Organizer-side reads against `booking_inquiries`. Filtered by
 * `buyer_tenant_id` (the orgnz tenant that sent the inquiry). Mirrors
 * `lib/vndr/inquiries.ts` shape on the buyer side; joins `vendors` for
 * the recipient display name so the list can render "Carter Wedding ·
 * Stellar Florals" without an additional client-side fetch.
 *
 * V-2c Session 1 ships this for the `/orgnz/inquiries` route. Per the
 * Option B brief the buyer_tenant_id approach also supports venue
 * buyers via the same column, but the venue-side `/venu/inquiries`
 * surface lands in a later session.
 */

export type OrgnzInquiryStatus =
  | "inquiry"
  | "reviewing"
  | "quoted"
  | "penciled"
  | "inked"
  | "booked"
  | "closed";

export type OrgnzInquiry = {
  id: string;
  eventId: string | null;
  vndrTenantId: string;
  vendorDisplayName: string | null;
  eventDate: string;
  guestCount: number;
  message: string | null;
  proposedPriceCents: number | null;
  status: OrgnzInquiryStatus;
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
};

const COLS =
  "id, event_id, vndr_tenant_id, event_date, guest_count, message, proposed_price_cents, status, created_at, responded_at, expires_at";

export async function getOrgnzInquiries(
  buyerTenantId: string,
): Promise<OrgnzInquiry[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("booking_inquiries")
    .select(COLS)
    .eq("buyer_tenant_id", buyerTenantId)
    .eq("buyer_role", "orgnz")
    .order("created_at", { ascending: false });

  const inquiries = (rows ?? []) as Record<string, unknown>[];
  if (inquiries.length === 0) return [];

  // Batch-fetch vendor display names so the list can render "from vendor X"
  // without a per-row fetch. RLS on vendors is org-visible (vendors_select
  // mig 041) so this works under the orgnz session.
  const vndrTenantIds = Array.from(
    new Set(inquiries.map((r) => r.vndr_tenant_id as string)),
  );
  const { data: vendorRows } = await supabase
    .from("vendors")
    .select("tenant_id, display_name")
    .in("tenant_id", vndrTenantIds);
  const nameByTenant = new Map<string, string>();
  for (const v of vendorRows ?? []) {
    nameByTenant.set(
      (v as Record<string, unknown>).tenant_id as string,
      ((v as Record<string, unknown>).display_name as string | null) ?? "",
    );
  }

  return inquiries.map((row) => ({
    id: row.id as string,
    eventId: (row.event_id as string | null) ?? null,
    vndrTenantId: row.vndr_tenant_id as string,
    vendorDisplayName: nameByTenant.get(row.vndr_tenant_id as string) ?? null,
    eventDate: (row.event_date as string | null) ?? "",
    guestCount: (row.guest_count as number | null) ?? 0,
    message: (row.message as string | null) ?? null,
    proposedPriceCents: (row.proposed_price_cents as number | null) ?? null,
    status: row.status as OrgnzInquiryStatus,
    createdAt: row.created_at as string,
    respondedAt: (row.responded_at as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
  }));
}
