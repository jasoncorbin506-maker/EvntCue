"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VendorCertification } from "@/lib/vndr/profile";
import type { CertTypeKey } from "@/lib/labels/cert-types";
import { CertificationSheet } from "./CertificationSheet";
import s from "../vndr.module.css";

/**
 * Certifications section on /vndr/profile. Wraps the read-only list display
 * + adds an "Add certification" button that opens CertificationSheet.
 *
 * Before this component, vendors who skipped or missed certifications during
 * Stage 4 onboarding had NO recovery path on the platform — the only option
 * was admin intervention. Now they can add or re-upload from Profile at any
 * time.
 *
 * router.refresh() pulls the new certifications list from the server after
 * a successful upload, so the new row appears without a hard reload.
 */

const CERT_LABEL: Record<string, string> = {
  business_license: "Business license",
  general_liability_insurance: "General liability insurance",
  food_handler: "Food handler's permit",
  liquor_license: "Liquor license",
  health_permit: "Health permit",
  workers_comp: "Workers' comp",
  certificate_of_insurance: "Certificate of insurance",
  servsafe: "ServSafe",
  bonded: "Bonded",
};

type Props = {
  certifications: VendorCertification[];
};

export function CertificationsSection({ certifications }: Props) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const uploadedKeys = new Set<CertTypeKey>(
    certifications.map((c) => c.certType as CertTypeKey),
  );

  function handleSuccess() {
    setSheetOpen(false);
    router.refresh();
  }

  return (
    <div className={s.profileSection}>
      <div className={s.sectionHead}>
        <span className={s.sectionTitle}>Certifications</span>
        <button
          type="button"
          className={s.sectionAddBtn}
          onClick={() => setSheetOpen(true)}
        >
          + Add
        </button>
      </div>

      {certifications.length === 0 ? (
        <div className={s.formHint}>
          No certifications on file yet. Adding business license + insurance
          earns the Verified badge organizers look for.
        </div>
      ) : (
        <ul className={s.certList}>
          {certifications.map((c) => (
            <li key={c.id} className={s.certRow}>
              <span className={s.certName}>
                {CERT_LABEL[c.certType] ?? c.certType}
              </span>
              <span
                className={`${s.certBadge} ${c.verified ? s.certVerified : s.certPending}`.trim()}
              >
                {c.verified ? "Verified" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {sheetOpen && (
        <CertificationSheet
          uploadedKeys={uploadedKeys}
          onClose={() => setSheetOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
