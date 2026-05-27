"use server";

import { getInquiryThread } from "@/lib/messaging/inquiry-thread";
import type { InquiryThreadView } from "@/lib/messaging/inquiry-thread-shared";

/**
 * Server-action wrapper around getInquiryThread for the organizer-side
 * InquiryThread client component. RLS-gated.
 */
export async function loadInquiryThreadOrgnz(
  inquiryId: string,
): Promise<InquiryThreadView> {
  return getInquiryThread(inquiryId, "orgnz");
}
