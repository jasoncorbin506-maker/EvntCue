/**
 * Client-safe types for inquiry messaging (V-2c Session 1, migration 058).
 *
 * Mirrors the split-shared pattern from session 23 (lib/vndr/packages-shared.ts,
 * lib/events/vendor-presence-shared.ts) so Client Components can import these
 * types without dragging `import "server-only"` from inquiry-thread.ts into
 * the browser bundle.
 */

export type InquirySenderRole = "vndr" | "orgnz" | "venue" | "plnr";

export type InquiryBuyerRole = "orgnz" | "venue";

export type InquiryMessage = {
  id: string;
  inquiryId: string;
  senderUserId: string;
  senderTenantId: string;
  senderRole: InquirySenderRole;
  body: string;
  /** ISO timestamp; null when counter-party hasn't marked the message read yet. */
  readAt: string | null;
  createdAt: string;
};

/**
 * Render-side view of a single thread: the messages plus a small set of
 * derived counts the UI uses for unread indicators inside the sheet.
 */
export type InquiryThreadView = {
  inquiryId: string;
  messages: InquiryMessage[];
  /** Messages from the OTHER party that this viewer hasn't read yet. */
  unreadFromCounterparty: number;
};
