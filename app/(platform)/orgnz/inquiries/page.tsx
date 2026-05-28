import { redirect } from "next/navigation";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";
import { getOrgnzInquiries } from "@/lib/orgnz/inquiries";
import { getPendingReviewPromptsForOrganizer } from "@/lib/reviews/event-reviews";
import { getPendingCancellationRequestsForOrganizer } from "@/lib/bookings/cancellation-requests";
import { OrgnzInquiriesList } from "../_components/OrgnzInquiriesList";
import { ReviewPromptsCard } from "../_components/ReviewPromptsCard";
import { IncomingCancellationRequestsCard } from "../_components/IncomingCancellationRequestsCard";

/**
 * Organizer Inquiries tab — V-2c Session 1 + Session 2 surfaces.
 *
 * Hosts three things in one scroll:
 *   1. Incoming cancellation requests (Session 2 Stream B) — high-
 *      urgency; vendor's asking to cancel an existing booking.
 *   2. Pending review prompts (Session 2 Stream A) — vendors the
 *      organizer hasn't yet reviewed on past events.
 *   3. The inquiries list itself (Session 1) — sent inquiries with
 *      message threads.
 *
 * Cancellation responses + review submission live here rather than on
 * /orgnz home because /orgnz home's Feed pattern is complex; this is
 * the natural "vendor relationships" surface. Jason can refile to home
 * Feed later if preferred — surfacing components stay reusable.
 *
 * Filter chip mapping matches the vendor side so users moving between
 * portals see consistent vocabulary:
 *   Open   = inquiry + reviewing
 *   Quoted = quoted + penciled
 *   Booked = inked + booked
 *   Lost   = closed
 */
type SearchParams = Promise<{ thread?: string }>;

export default async function OrgnzInquiries({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const organizer = await getCurrentOrganizer();
  if (!organizer) redirect("/login?role=orgnz");

  const [{ thread }, inquiries, reviewPrompts, cancellationRequests] =
    await Promise.all([
      searchParams,
      getOrgnzInquiries(organizer.tenantId),
      getPendingReviewPromptsForOrganizer(organizer.tenantId),
      getPendingCancellationRequestsForOrganizer(organizer.tenantId),
    ]);

  // Deep-link: ?thread=<inquiry-id> opens that thread's sheet on mount.
  // Validated against the loaded inquiries list so a stale link silently
  // falls through to the unopened state instead of a confusing empty sheet.
  const initialOpenId =
    thread && inquiries.some((i) => i.id === thread) ? thread : null;

  return (
    <div style={{ padding: "14px 16px 32px" }}>
      {cancellationRequests.length > 0 && (
        <IncomingCancellationRequestsCard requests={cancellationRequests} />
      )}
      {reviewPrompts.length > 0 && (
        <ReviewPromptsCard prompts={reviewPrompts} />
      )}
      <OrgnzInquiriesList inquiries={inquiries} initialOpenId={initialOpenId} />
    </div>
  );
}
