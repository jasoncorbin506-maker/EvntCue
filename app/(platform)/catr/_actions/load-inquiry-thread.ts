"use server";

import { getInquiryThread } from "@/lib/messaging/inquiry-thread";
import type { InquiryThreadView } from "@/lib/messaging/inquiry-thread-shared";

/**
 * Server-action wrapper around getInquiryThread so the CatrInquiryThread client
 * component can load + refresh thread state on demand. RLS gates the read —
 * the caterer only sees messages on inquiries where they're the recipient.
 */
export async function loadInquiryThreadCatr(
  inquiryId: string,
): Promise<InquiryThreadView> {
  return getInquiryThread(inquiryId, "catr");
}
