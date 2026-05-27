import { redirect } from "next/navigation";
import { Chrome, ChromeSignOut } from "../_components/Chrome";
import { InquiriesSegment } from "../_components/Segment";
import { getCurrentVenue } from "@/lib/venu/current-venue";
import { getVenueInquiries } from "@/lib/venu/inquiries";

/**
 * Venu Inquiries tab. Wire-DB: reads venue_inquiries filtered by the current
 * venue's tenant; segment filtering is local state inside InquiriesSegment.
 */
export default async function VenuInquiries() {
  const venue = await getCurrentVenue();
  if (!venue) redirect("/venues");

  const inquiries = await getVenueInquiries(venue.tenantId);

  return (
    <>
      <Chrome
        venueName={venue.displayName}
        roleLabel="Inquiries"
        backHref="/venu/discover"
        right={<ChromeSignOut />}
      />
      <InquiriesSegment inquiries={inquiries} />
    </>
  );
}
