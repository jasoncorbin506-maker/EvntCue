import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DepositStatus } from "@/lib/labels/deposit-status";

/** The seller side an inquiry targets (mirrors inquiries.recipient_type CHECK). */
export type InquiryRecipientType = "vndr" | "venu" | "catr";

/**
 * Organizer-side reads against `inquiries`. Filtered by
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
  /** Recipient tenant. Field name is legacy (was vndr-only); now any seller type. */
  vndrTenantId: string;
  /** Which seller portal the inquiry targets — drives the row's type chip + label. */
  recipientType: InquiryRecipientType;
  /** Recipient's business display name, resolved per type (vendors / venues). */
  vendorDisplayName: string | null;
  eventDate: string;
  guestCount: number;
  message: string | null;
  proposedPriceCents: number | null;
  status: OrgnzInquiryStatus;
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
  depositStatus: DepositStatus;
  depositAmountCents: number | null;
  holdExpiresAt: string | null;
  /** The buyer's original offer (mig 091) — null when none was attached. Lets
   *  the detail sheet show the counter delta ("$500 above your offer"). */
  initialOfferCents: number | null;
};

const COLS =
  "id, event_id, recipient_tenant_id, recipient_type, event_date, guest_count, message, proposed_price_cents, status, created_at, responded_at, expires_at, deposit_status, deposit_amount_cents, hold_expires_at, initial_offer_cents";

export async function getOrgnzInquiries(
  buyerTenantId: string,
): Promise<OrgnzInquiry[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("inquiries")
    .select(COLS)
    .eq("buyer_tenant_id", buyerTenantId)
    .eq("buyer_role", "orgnz")
    .order("created_at", { ascending: false });

  const inquiries = (rows ?? []) as Record<string, unknown>[];
  if (inquiries.length === 0) return [];

  // Batch-fetch recipient display names so the list renders "from X" without a
  // per-row fetch. Names live in different tables per seller type:
  //   vndr → vendors.display_name (org-visible under orgnz RLS, mig 041)
  //   venu → venues.display_name  (read via admin, scoped to this buyer's
  //          recipient ids — the orgnz session has no general venues-read, and
  //          a venue may have unpublished since the inquiry was sent, so the
  //          published marketplace view isn't a reliable name source here)
  const idsByType = { vndr: [] as string[], venu: [] as string[], catr: [] as string[] };
  for (const r of inquiries) {
    const t = (r.recipient_type as InquiryRecipientType) ?? "vndr";
    const id = r.recipient_tenant_id as string;
    if (t === "venu") idsByType.venu.push(id);
    else if (t === "catr") idsByType.catr.push(id);
    else idsByType.vndr.push(id);
  }
  const nameByTenant = new Map<string, string>();

  if (idsByType.vndr.length > 0) {
    const { data: vendorRows } = await supabase
      .from("vendors")
      .select("tenant_id, display_name")
      .in("tenant_id", Array.from(new Set(idsByType.vndr)));
    for (const v of vendorRows ?? []) {
      const rec = v as Record<string, unknown>;
      nameByTenant.set(rec.tenant_id as string, (rec.display_name as string | null) ?? "");
    }
  }
  if (idsByType.venu.length > 0) {
    const admin = createAdminClient();
    const { data: venueRows } = await admin
      .from("venues")
      .select("tenant_id, display_name")
      .in("tenant_id", Array.from(new Set(idsByType.venu)));
    for (const v of venueRows ?? []) {
      const rec = v as Record<string, unknown>;
      nameByTenant.set(rec.tenant_id as string, (rec.display_name as string | null) ?? "");
    }
  }

  return inquiries.map((row) => ({
    id: row.id as string,
    eventId: (row.event_id as string | null) ?? null,
    vndrTenantId: row.recipient_tenant_id as string,
    recipientType: ((row.recipient_type as InquiryRecipientType | null) ?? "vndr"),
    vendorDisplayName: nameByTenant.get(row.recipient_tenant_id as string) || null,
    eventDate: (row.event_date as string | null) ?? "",
    guestCount: (row.guest_count as number | null) ?? 0,
    message: (row.message as string | null) ?? null,
    proposedPriceCents: (row.proposed_price_cents as number | null) ?? null,
    status: row.status as OrgnzInquiryStatus,
    createdAt: row.created_at as string,
    respondedAt: (row.responded_at as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    depositStatus: ((row.deposit_status as DepositStatus | null) ?? "none"),
    depositAmountCents: (row.deposit_amount_cents as number | null) ?? null,
    holdExpiresAt: (row.hold_expires_at as string | null) ?? null,
    initialOfferCents: (row.initial_offer_cents as number | null) ?? null,
  }));
}
