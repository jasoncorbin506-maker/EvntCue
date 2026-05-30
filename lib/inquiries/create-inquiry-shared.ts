/**
 * Pure helpers for buyer-initiated inquiry creation (Phase 2b-W1).
 *
 * Kept Supabase-free + side-effect-free so the validation / mapping logic is
 * unit-testable under the repo's `lib/**` test glob — same idiom as
 * `lib/events/activation.ts` (Lock 27). The DB writes + auth live in the
 * server action (`app/(platform)/orgnz/_actions/create-inquiry.ts`), which
 * composes these.
 *
 * ── Verified data-model notes (Supabase MCP, 2026-05-29) ───────────────────
 * The original Phase 2b brief's W1.1 INSERT shape diverged from the live DB in
 * several ways; these helpers encode the corrected shape:
 *   - column is `message` (nullable), NOT `message_text`
 *   - `event_date` is NOT NULL → caller defaults it to the event's start_date
 *   - initial status is `'inquiry'` (the enum's first/default state), NOT
 *     `'reviewing'` (the brief omitted `inquiry` from its enum list)
 *   - seller portal is derived from `tenants.type` (enum: orgnz|plnr|vndr|catr|
 *     venue); note `venue` → `'venu'` for the email SellerPortal label
 */

import type { BuyerRole, SellerPortal } from "@/lib/email/templates/booking-lifecycle";

/** Buyer-side portal route segments. `venue` buyer-role → `venu` route, mirroring the seller `venue`→`venu` rename. */
export type BuyerPortal = "orgnz" | "venu";

/** The `tenants.type` enum (mig: tenant_type). Source of seller-portal truth. */
export type TenantType = "orgnz" | "plnr" | "vndr" | "catr" | "venue";

/** Typed failure codes the create-inquiry action returns (UI surfaces via Lock 22). */
export const INQUIRY_ERRORS = {
  EVENT_NOT_FOUND: "event_not_found",
  EVENT_NOT_ACTIVATED: "event_not_activated",
  INVALID_SELLER: "invalid_seller",
  MISSING_MESSAGE: "missing_message",
} as const;

export type InquiryErrorCode =
  (typeof INQUIRY_ERRORS)[keyof typeof INQUIRY_ERRORS];

/** Buyer-typed inquiry message length cap (mirrors the email truncate budget). */
export const MESSAGE_MAX = 2000;

/**
 * Map a seller tenant's `tenants.type` to the email/route SellerPortal label.
 * Returns null for `orgnz` (organizers are buyers, never inquiry recipients) —
 * the caller treats null as INVALID_SELLER. The `venue` → `'venu'` rename is the
 * one non-identity mapping (the portal route segment + email accent key is
 * `venu`, the tenant type is `venue`).
 */
export function tenantTypeToSellerPortal(
  type: string | null | undefined,
): SellerPortal | null {
  switch (type) {
    case "vndr":
      return "vndr";
    case "catr":
      return "catr";
    case "plnr":
      return "plnr";
    case "venue":
      return "venu";
    default:
      // "orgnz" or any unknown type → not a valid inquiry recipient.
      return null;
  }
}

/**
 * Map a buyer's `inquiries.buyer_role` to its portal route segment, for building
 * buyer-facing CTA links (e.g. the decline email's "Open event" button →
 * `/{portal}/events/{id}`). The `venue` → `'venu'` rename mirrors the seller
 * mapping. Anything other than an explicit `'venue'` (including null / unknown)
 * resolves to `'orgnz'` — the overwhelming-majority buyer and the safe default,
 * since orgnz is the only buyer surface fully shipped today.
 */
export function buyerRoleToPortal(
  role: string | null | undefined,
): BuyerPortal {
  return role === "venue" ? "venu" : "orgnz";
}

/** Re-export the renderer's BuyerRole so action code has one import site. */
export type { BuyerRole };

/**
 * Validate + normalize a buyer's inquiry message. Required, trimmed, capped.
 * Returns the cleaned message on success or a MISSING_MESSAGE code when blank.
 */
export function validateInquiryMessage(
  raw: string | null | undefined,
):
  | { ok: true; message: string }
  | { ok: false; error: typeof INQUIRY_ERRORS.MISSING_MESSAGE } {
  const trimmed = (raw ?? "").trim();
  if (trimmed.length === 0) {
    return { ok: false, error: INQUIRY_ERRORS.MISSING_MESSAGE };
  }
  return { ok: true, message: trimmed.slice(0, MESSAGE_MAX) };
}

/**
 * Resolve the inquiry's `event_date` (NOT NULL column). The buyer may pass an
 * optional date hint; absent (or blank) → default to the event's start_date.
 * Both inputs are `YYYY-MM-DD` date strings.
 */
export function resolveInquiryEventDate(
  hint: string | null | undefined,
  eventStartDate: string,
): string {
  const trimmed = (hint ?? "").trim();
  return trimmed.length > 0 ? trimmed : eventStartDate;
}
