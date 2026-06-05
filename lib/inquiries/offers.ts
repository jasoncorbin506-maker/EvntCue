import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  InquiryOfferAction,
  InquiryOfferCause,
} from "@/lib/labels/inquiry-offer";

/**
 * Inquiry-offer ledger reads + the shared insert helper (mig 091, negotiation
 * Layer B). Append-only — each row is one party's action (claim / counter /
 * accept / decline). RLS (inq_offers_participant_select/insert) scopes both to
 * the inquiry's two participant tenants; turn order + the one-counter-each-way
 * cap are enforced in the action layer, not here.
 */

export type InquiryOfferRole = "orgnz" | "vndr" | "catr" | "venue";

export type InquiryOfferRow = {
  id: string;
  inquiryId: string;
  offeredByTenantId: string;
  offeredByRole: InquiryOfferRole;
  action: InquiryOfferAction;
  priceCents: number | null;
  cause: InquiryOfferCause | null;
  note: string | null;
  attachmentPath: string | null;
  createdAt: string;
};

const COLS =
  "id, inquiry_id, offered_by_tenant_id, offered_by_role, action, price_cents, cause, note, attachment_path, created_at";

function shape(r: Record<string, unknown>): InquiryOfferRow {
  return {
    id: r.id as string,
    inquiryId: r.inquiry_id as string,
    offeredByTenantId: r.offered_by_tenant_id as string,
    offeredByRole: r.offered_by_role as InquiryOfferRole,
    action: r.action as InquiryOfferAction,
    priceCents: (r.price_cents as number | null) ?? null,
    cause: (r.cause as InquiryOfferCause | null) ?? null,
    note: (r.note as string | null) ?? null,
    attachmentPath: (r.attachment_path as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

/** Full ledger for an inquiry, oldest → newest. RLS-scoped to participants. */
export async function getInquiryOffers(
  inquiryId: string,
): Promise<InquiryOfferRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiry_offers")
    .select(COLS)
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((r) => shape(r as Record<string, unknown>));
}

export type LogInquiryOfferArgs = {
  inquiryId: string;
  offeredByTenantId: string;
  offeredByRole: InquiryOfferRole;
  action: InquiryOfferAction;
  priceCents?: number | null;
  cause?: InquiryOfferCause | null;
  note?: string | null;
  attachmentPath?: string | null;
};

/**
 * Append one offer row. Takes the caller's RLS-scoped client so the insert runs
 * as the acting party (inq_offers_participant_insert checks offered_by_tenant_id
 * ∈ the user's tenants). Honors the mig-091 CHECK: counter needs price+cause,
 * decline needs cause with no price, claim/accept are unconstrained.
 */
export async function logInquiryOffer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  a: LogInquiryOfferArgs,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("inquiry_offers").insert({
    inquiry_id: a.inquiryId,
    offered_by_tenant_id: a.offeredByTenantId,
    offered_by_role: a.offeredByRole,
    action: a.action,
    price_cents: a.priceCents ?? null,
    cause: a.cause ?? null,
    note: a.note?.trim() || null,
    attachment_path: a.attachmentPath ?? null,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
