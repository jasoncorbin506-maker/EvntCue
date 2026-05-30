import { createClient } from "@/lib/supabase/server";
import type { InquiryStatus } from "@/lib/labels/inquiry-status";
import type { InquiryBuyerRole } from "@/lib/messaging/inquiry-thread-shared";

/**
 * Caterer-side reads against the unified `inquiries` table. Catr is an
 * "expanded Vndr" at the inquiry layer (Lock 77, closed 2026-05-28) — no
 * separate catr_inquiries table; catr rows are simply those with
 * recipient_type='catr'. Both filters are load-bearing: recipient_tenant_id
 * scopes to this caterer, recipient_type keeps an operator who also holds a
 * vndr listing from seeing their vndr leads here.
 *
 * The live buyer-initiated path (orgnz → seller) writes `message` + `event_id`
 * with `client_name` null; seeded external leads carry `client_name` +
 * `est_revenue_cents`. The shape projects both so either origin renders.
 */

export type CatrInquiry = {
  id: string;
  title: string;
  eventDate: string;
  guestCount: number;
  budgetCents: number;
  /** Caterer's quoted price (proposed_price_cents); null until they respond. */
  quotedPriceCents: number | null;
  /** Hold deadline (expires_at); set while status is 'penciled', else null. */
  expiresAt: string | null;
  message: string | null;
  status: InquiryStatus;
  hoursSinceCreated: number;
  /** Buyer side of the thread. External leads (buyer_role null) default to orgnz for labeling. */
  buyerRole: InquiryBuyerRole;
};

const COLS =
  "id, client_name, event_date, guest_count, est_revenue_cents, proposed_price_cents, expires_at, message, status, created_at, buyer_role";

function shape(row: Record<string, unknown>, now: number): CatrInquiry {
  const createdMs = new Date(row.created_at as string).getTime();
  const hoursSinceCreated = Math.max(0, Math.floor((now - createdMs) / 3_600_000));
  return {
    id: row.id as string,
    title: (row.client_name as string | null) ?? "Event inquiry",
    eventDate: (row.event_date as string | null) ?? "",
    guestCount: (row.guest_count as number | null) ?? 0,
    budgetCents: (row.est_revenue_cents as number | null) ?? 0,
    quotedPriceCents: (row.proposed_price_cents as number | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    message: (row.message as string | null) ?? null,
    status: row.status as InquiryStatus,
    hoursSinceCreated,
    buyerRole: (row.buyer_role as InquiryBuyerRole | null) ?? "orgnz",
  };
}

export async function getCatrInquiries(tenantId: string): Promise<CatrInquiry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select(COLS)
    .eq("recipient_tenant_id", tenantId)
    .eq("recipient_type", "catr")
    .order("created_at", { ascending: false });

  const now = Date.now();
  return (data ?? []).map((row) => shape(row as Record<string, unknown>, now));
}

/** New-segment count (status ∈ {inquiry, reviewing}) for the chrome badge. */
export async function getCatrNewInquiryCount(tenantId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("recipient_tenant_id", tenantId)
    .eq("recipient_type", "catr")
    .in("status", ["inquiry", "reviewing"]);
  return count ?? 0;
}

export async function getCatrInquiry(id: string): Promise<CatrInquiry | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select(COLS)
    .eq("id", id)
    .eq("recipient_type", "catr")
    .maybeSingle();

  if (!data) return null;
  return shape(data as Record<string, unknown>, Date.now());
}
