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
 * testing surfaces first-time-user confusion.
 */

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

const STATUS_LABELS: Record<InquiryStatus, string> = {
  inquiry: "New",
  reviewing: "Reviewing",
  quoted: "Quoted",
  penciled: "Penciled",
  inked: "Inked",
  booked: "Booked",
  closed: "Closed",
};

const EDGE_FLAG_LABELS: Record<InquiryEdgeFlag, string> = {
  wrong_fit: "Wrong fit",
  paused: "Paused",
  lost: "Lost",
  wait_list: "Wait list",
};

/**
 * Map an inquiry status enum to its UI display string. Falls back to the raw
 * enum value if an unrecognized state slips through (e.g., a pre-migration
 * row from the old vendor-response enum).
 */
export function inquiryStatusLabel(status: string): string {
  return STATUS_LABELS[status as InquiryStatus] ?? status;
}

export function inquiryEdgeFlagLabel(flag: string): string {
  return EDGE_FLAG_LABELS[flag as InquiryEdgeFlag] ?? flag;
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
