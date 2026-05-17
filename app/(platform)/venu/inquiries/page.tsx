import { Chrome } from "../_components/Chrome";
import { InquiriesSegment } from "../_components/Segment";

/**
 * Venu Inquiries tab. Chunk B — visual port complete on stub demo data.
 *
 * Real reads against booking_inquiries land in a later chunk once the
 * spec/DB enum gap closes (master spec v27.1 Lock 4+5b lifecycle vs. migration
 * 003's vendor-response enum — flagged in PARKING_LOT). The Segment +
 * InquiryRow components accept the same shape so the swap is mechanical.
 */
export default function VenuInquiries() {
  return (
    <>
      <Chrome venueName="The Lantern Hall" roleLabel="Inquiries" backHref="/venu/discover" />
      <InquiriesSegment />
    </>
  );
}
