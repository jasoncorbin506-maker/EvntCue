import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { InquiryBuyerRole } from "@/lib/messaging/inquiry-thread-shared";

/**
 * Vendor-side reads against `booking_inquiries`. Filtered by `vndr_tenant_id`
 * (the receiver). Mig 059 generalized the buyer side from "organizer-only" to
 * `buyer_tenant_id + buyer_role` (Option B); vendor reads now project both so
 * the UI can render "from organizer X" vs "from venue X" labels.
 *
 * Used by V-2b Home (oldest-unresponded for Response Window Alert + 4-tile
 * Hero Metrics computation + active pipeline) AND by the Inquiries tab in
 * Session B.
 */

export type VndrInquiryStatus =
  | "inquiry"
  | "reviewing"
  | "quoted"
  | "penciled"
  | "inked"
  | "booked"
  | "closed";

export type VndrInquiry = {
  id: string;
  eventId: string | null;
  buyerTenantId: string;
  buyerRole: InquiryBuyerRole;
  eventDate: string;
  guestCount: number;
  message: string | null;
  proposedPriceCents: number | null;
  status: VndrInquiryStatus;
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
};

const COLS =
  "id, event_id, buyer_tenant_id, buyer_role, event_date, guest_count, message, proposed_price_cents, status, created_at, responded_at, expires_at";

function shape(row: Record<string, unknown>): VndrInquiry {
  return {
    id: row.id as string,
    eventId: (row.event_id as string | null) ?? null,
    buyerTenantId: row.buyer_tenant_id as string,
    buyerRole: row.buyer_role as InquiryBuyerRole,
    eventDate: (row.event_date as string | null) ?? "",
    guestCount: (row.guest_count as number | null) ?? 0,
    message: (row.message as string | null) ?? null,
    proposedPriceCents: (row.proposed_price_cents as number | null) ?? null,
    status: row.status as VndrInquiryStatus,
    createdAt: row.created_at as string,
    respondedAt: (row.responded_at as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
  };
}

export async function getVndrInquiries(vendorTenantId: string): Promise<VndrInquiry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_inquiries")
    .select(COLS)
    .eq("vndr_tenant_id", vendorTenantId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}
