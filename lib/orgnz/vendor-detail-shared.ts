/**
 * Client-safe types for the orgnz dashboard's VendorDetailSheet. Split out
 * from `vendor-detail.ts` so the sheet (a Client Component) can import
 * without dragging `server-only` into its import graph — matches the
 * `vendor-presence-shared.ts` pattern.
 */

import type { EventNotificationResponse } from "@/lib/events/event-notifications-shared";

export type VendorBookingSummary = {
  bookingId: string;
  status: string;
  packageName: string | null;
  packagePriceCents: number | null;
  totalCents: number;
  depositPct: number;
  confirmedAt: string | null;
};

export type VendorNotificationSummary = {
  id: string;
  response: EventNotificationResponse;
  oldStartDate: string | null;
  newStartDate: string | null;
  emailDeliveryFailed: boolean;
  createdAt: string;
};

export type VendorDetail = {
  vndrTenantId: string;
  displayName: string | null;
  primaryCategory: string | null;
  contactEmail: string | null;
  booking: VendorBookingSummary | null;
  latestNotification: VendorNotificationSummary | null;
  /** When set, deep-links to /orgnz/inquiries?thread=<id>. */
  inquiryThreadId: string | null;
};
