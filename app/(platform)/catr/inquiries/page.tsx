import { redirect } from "next/navigation";

import { getCurrentCaterer } from "@/lib/catr/current-caterer";
import { getCatrInquiries } from "@/lib/catr/inquiries";

import { Chrome, ChromeSignOut } from "../_components/Chrome";
import { InquiryRow } from "../_components/InquiryRow";
import s from "../catr.module.css";

/**
 * Catr Inquiries tab. Reads the unified `inquiries` table filtered to this
 * caterer (recipient_type='catr'); rows link to the detail route.
 */
export default async function CatrInquiries() {
  const caterer = await getCurrentCaterer();
  if (!caterer) redirect("/login?role=catr");

  const inquiries = await getCatrInquiries(caterer.tenantId);

  return (
    <>
      <Chrome
        catererName={caterer.displayName}
        roleLabel="Inquiries"
        backHref="/catr"
        right={<ChromeSignOut />}
      />

      {inquiries.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyStateIcon} aria-hidden="true">✦</div>
          <div className={s.emptyStateTitle}>No inquiries yet</div>
          <div className={s.emptyStateBody}>
            When organizers reach out about catering, their inquiries land
            here. Make sure your profile is complete so Cue can match you to
            the right events.
          </div>
        </div>
      ) : (
        <div className={s.inqList}>
          {inquiries.map((inquiry) => (
            <InquiryRow key={inquiry.id} inquiry={inquiry} />
          ))}
        </div>
      )}
    </>
  );
}
