/**
 * Inquiry-status display labels — Lock 15 translation layer.
 *
 * Maps the canonical seven-state inquiry lifecycle (locked in master spec
 * v27.1 as Lock 4 + 5b) to public-professional display strings.
 *
 * DB-vs-spec gap (flagged in PARKING_LOT): migration 003 still has the old
 * `inquiry_status` enum (`pending,viewed,accepted,declined,expired,withdrawn,
 * converted`) — vendor-response model. The new seven-state lifecycle
 * (`inquiry,reviewing,quoted,penciled,inked,booked,closed`) is the
 * conversation-flow model that the lock doc + master spec committed to.
 * A separate migration aligns the DB; until then, real `booking_inquiries`
 * reads will fail against these enum values. Stub data in the Venu portal
 * uses the new values per the spec's direction.
 *
 * Jason's 2026-05-17 decision on "inked":
 * Kept as "Inked" (industry slang) rather than swapping to "Signed" — punchy
 * + evokes the moment a contract is locked. Subject to revisit if user
 * testing surfaces first-time-user confusion. Reaffirmed 2026-05-27 against
 * a stale brief instruction recommending the swap.
 *
 * ES coverage added 2026-05-27 (PL #42). DFW-Hispanic register per Lock 14b —
 * "Inked" translates as "Firmado" in Spanish (industry slang doesn't carry
 * across; ES gets the dignified-professional form).
 */

import type { Locale } from "@/i18n/locale";

export type InquiryStatus =
  | "inquiry"
  | "reviewing"
  | "quoted"
  | "penciled"
  | "inked"
  | "booked"
  | "closed";

export type InquiryEdgeFlag =
  | "wrong_fit"
  | "paused"
  | "lost"
  | "wait_list";

const STATUS_LABELS_EN: Record<InquiryStatus, string> = {
  inquiry: "New",
  reviewing: "Reviewing",
  quoted: "Quoted",
  penciled: "Penciled",
  inked: "Inked",
  booked: "Booked",
  closed: "Closed",
};

const STATUS_LABELS_ES: Record<InquiryStatus, string> = {
  inquiry: "Nueva",
  reviewing: "En revisión",
  quoted: "Cotizada",
  penciled: "Tentativa",
  inked: "Firmada",
  booked: "Reservada",
  closed: "Cerrada",
};

const EDGE_FLAG_LABELS_EN: Record<InquiryEdgeFlag, string> = {
  wrong_fit: "Wrong fit",
  paused: "Paused",
  lost: "Lost",
  wait_list: "Wait list",
};

const EDGE_FLAG_LABELS_ES: Record<InquiryEdgeFlag, string> = {
  wrong_fit: "Mal ajuste",
  paused: "En pausa",
  lost: "Perdida",
  wait_list: "Lista de espera",
};

/**
 * Map an inquiry status enum to its UI display string. Falls back to the raw
 * enum value if an unrecognized state slips through (e.g., a pre-migration
 * row from the old vendor-response enum).
 *
 * `locale` is optional — defaults to "en" so back-of-house callers
 * (Venu portal, Plnr CRM) don't have to thread locale until their portal
 * gets Spanish coverage (per lib/labels/README.md phasing).
 */
export function inquiryStatusLabel(status: string, locale: Locale = "en"): string {
  const table = locale === "es" ? STATUS_LABELS_ES : STATUS_LABELS_EN;
  return table[status as InquiryStatus] ?? STATUS_LABELS_EN[status as InquiryStatus] ?? status;
}

export function inquiryEdgeFlagLabel(flag: string, locale: Locale = "en"): string {
  const table = locale === "es" ? EDGE_FLAG_LABELS_ES : EDGE_FLAG_LABELS_EN;
  return table[flag as InquiryEdgeFlag] ?? EDGE_FLAG_LABELS_EN[flag as InquiryEdgeFlag] ?? flag;
}

/**
 * SLA dot color mapping. Time-since-inquiry vs response budget drives the
 * dot's severity on inquiry rows. Color tokens:
 *   green (--teal)  = fresh, well within SLA
 *   amber (--gold)  = response budget burning down
 *   red (--rose)    = past SLA, urgent
 *   neutral (--txt3) = closed / booked — no SLA pressure
 */
export type SlaSeverity = "fresh" | "watch" | "late" | "closed";

export function slaSeverityFor(status: InquiryStatus, hoursSinceCreated: number): SlaSeverity {
  if (status === "booked" || status === "closed") return "closed";
  if (hoursSinceCreated >= 48) return "late";
  if (hoursSinceCreated >= 24) return "watch";
  return "fresh";
}
