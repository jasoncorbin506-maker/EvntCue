import { redirect } from "next/navigation";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";
import { getOrgnzInquiries } from "@/lib/orgnz/inquiries";
import { OrgnzInquiriesList } from "../_components/OrgnzInquiriesList";

/**
 * Organizer Inquiries tab — V-2c Session 1 (2026-05-26). Lists all
 * inquiries this organizer has sent across all their events, with the
 * vendor display name on each row + message thread accessible via the
 * detail sheet.
 *
 * Mirrors `/vndr/inquiries` (V-2b Session B) for the buyer side. Filter
 * chip mapping matches the vendor side so users moving between portals
 * see consistent vocabulary:
 *   Open   = inquiry + reviewing
 *   Quoted = quoted + penciled
 *   Booked = inked + booked
 *   Lost   = closed
 */
export default async function OrgnzInquiries() {
  const organizer = await getCurrentOrganizer();
  if (!organizer) redirect("/login?role=orgnz");

  const inquiries = await getOrgnzInquiries(organizer.tenantId);
  return <OrgnzInquiriesList inquiries={inquiries} />;
}
