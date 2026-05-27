"use server";

import { getInquiryThread } from "@/lib/messaging/inquiry-thread";
import type { InquiryThreadView } from "@/lib/messaging/inquiry-thread-shared";

/**
 * Server-action wrapper around getInquiryThread so the InquiryThread client
 * component can load + refresh thread state on demand (on mount, after send,
 * after delete). RLS gates the read — caller only sees messages on inquiries
 * they're party to.
 */
export async function loadInquiryThreadVndr(
  inquiryId: string,
): Promise<InquiryThreadView> {
  return getInquiryThread(inquiryId, "vndr");
}
