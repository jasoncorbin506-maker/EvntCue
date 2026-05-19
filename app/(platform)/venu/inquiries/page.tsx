import { redirect } from "next/navigation";
import { Chrome } from "../_components/Chrome";
import { InquiriesSegment } from "../_components/Segment";
import { getCurrentVenue } from "@/lib/venu/current-venue";

/**
 * Venu Inquiries tab. Chunk B visual port; chunk C wire-DB pass swaps the
 * Segment's stub data for real venue_inquiries reads (migration 028
 * already aligned the spec/DB enum gap — PARKING_LOT #49 closed 2026-05-18).
 */
export default async function VenuInquiries() {
  const venue = await getCurrentVenue();
  if (!venue) redirect("/venues");

  return (
    <>
      <Chrome venueName={venue.displayName} roleLabel="Inquiries" backHref="/venu/discover" />
      <InquiriesSegment />
    </>
  );
}
