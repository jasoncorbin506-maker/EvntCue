import { createClient } from "@/lib/supabase/server";
import type { InquiryStatus } from "@/lib/labels/inquiry-status";

export type VenuInquiry = {
  id: string;
  eventName: string;
  eventDate: string;
  guestCount: number;
  budgetCents: number;
  status: InquiryStatus;
  hoursSinceCreated: number;
  badges: string[];
};

function shape(row: Record<string, unknown>, now: number): VenuInquiry {
  const createdMs = new Date(row.created_at as string).getTime();
  const hoursSinceCreated = Math.max(0, Math.floor((now - createdMs) / 3_600_000));
  return {
    id: row.id as string,
    eventName: (row.client_name as string | null) ?? "Unnamed inquiry",
    eventDate: (row.event_date as string | null) ?? "",
    guestCount: (row.guest_count as number | null) ?? 0,
    budgetCents: (row.est_revenue_cents as number | null) ?? 0,
    status: row.status as InquiryStatus,
    hoursSinceCreated,
    badges: [],
  };
}

const COLS = "id, client_name, event_date, guest_count, est_revenue_cents, status, created_at";

// Post-070 the venue inquiry rows live on the unified `inquiries` table; venue
// rows are those with recipient_type='venu' (the venue is the recipient). Both
// filters are needed: recipient_tenant_id scopes to this venue, recipient_type
// keeps a venue-operator who is also a vndr seller from seeing their vndr leads
// here.
export async function getVenueInquiries(tenantId: string): Promise<VenuInquiry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select(COLS)
    .eq("recipient_tenant_id", tenantId)
    .eq("recipient_type", "venu")
    .order("created_at", { ascending: false });

  const now = Date.now();
  return (data ?? []).map((row) => shape(row, now));
}

/**
 * Count of inquiries that fall under the "New" segment per
 * Venu_Locked_2026-05-13.md row 2: status ∈ {inquiry, reviewing}. Used by
 * the BottomNav badge + the Discover tile so neither shows a phantom number
 * when the venue has no real inquiries yet.
 */
export async function getVenueNewInquiryCount(tenantId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("recipient_tenant_id", tenantId)
    .eq("recipient_type", "venu")
    .in("status", ["inquiry", "reviewing"]);
  return count ?? 0;
}

export async function getVenueInquiry(id: string): Promise<VenuInquiry | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select(COLS)
    .eq("id", id)
    .eq("recipient_type", "venu")
    .maybeSingle();

  if (!data) return null;
  return shape(data, Date.now());
}
