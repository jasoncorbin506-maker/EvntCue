/**
 * Client-safe types for event_reviews (V-2c Session 2 Stream A, mig 062).
 *
 * Mirrors the split pattern from lib/messaging/inquiry-thread-shared.ts —
 * Client Components import types from here without dragging
 * `import "server-only"` from lib/reviews/event-reviews.ts into the
 * browser bundle.
 */

export type EventReviewerRole = "orgnz" | "vndr";

export type EventReview = {
  id: string;
  eventId: string;
  reviewerTenantId: string;
  reviewerRole: EventReviewerRole;
  revieweeTenantId: string;
  revieweeRole: EventReviewerRole;
  rating: number;
  body: string | null;
  createdAt: string;
};

export type ReviewAggregate = {
  count: number;
  average: number;
};

export type PendingReviewPrompt = {
  bookingId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  counterpartyTenantId: string;
  counterpartyDisplayName: string | null;
  counterpartyRole: EventReviewerRole;
};
