"use client";

import { useRef, useState, useTransition } from "react";
import { uploadCertAction } from "@/app/(public)/vndr-onboarding/[step]/_actions/upload-cert";
import { CERT_TYPES, type CertTypeKey } from "@/lib/labels/cert-types";
import s from "./CertificationSheet.module.css";

/**
 * Bottom-sheet for adding (or re-uploading) a vendor certification from
 * /vndr/profile. Mirrors the EditPackageSheet pattern used elsewhere on
 * the portal.
 *
 * Reuses `uploadCertAction` from the vndr-onboarding Stage 4 path — the
 * action is generic (no Stage-4-only assumptions); it just needs a
 * tenant context (via getCurrentVendor) and the same FormData shape.
 *
 * Closing the sheet on success triggers a router.refresh() (handled by
 * CertificationsSection) so the new/updated cert appears in the list
 * without a hard reload.
 */

type Props = {
  /** Already-uploaded cert types — used to grey-out / mark "Re-upload". */
  uploadedKeys: ReadonlySet<CertTypeKey>;
  onClose: () => void;
  onSuccess: () => void;
};

const MAX_BYTES = 10 * 1024 * 1024;

export function CertificationSheet({ uploadedKeys, onClose, onSuccess }: Props) {
  const [pending, startTransition] = useTransition();
  const [certType, setCertType] = useState<CertTypeKey>(
    CERT_TYPES[0]?.key ?? ("business_license" as CertTypeKey),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setError(null);
    if (!f) {
      setFilename(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File too large. Max 10MB.");
      setFilename(null);
      e.target.value = "";
      return;
    }
    setFilename(f.name);
  }

  function handleSubmit() {
    setError(null);
    const fileEl = fileInputRef.current;
    const file = fileEl?.files?.[0];
    if (!file) {
      setError("Pick a file to upload.");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("certType", certType);
      fd.append("file", file);
      const res = await uploadCertAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSuccess();
    });
  }

  const isReupload = uploadedKeys.has(certType);

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label="Add certification">
        <div className={s.header}>
          <div>
            <div className={s.title}>{isReupload ? "Re-upload certification" : "Add certification"}</div>
            <div className={s.subtitle}>
              PDF or photo · max 10 MB · re-verification kicks off automatically
            </div>
          </div>
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={s.fieldRow}>
          <label className={s.fieldLbl} htmlFor="cert-type">
            Type
          </label>
          <select
            id="cert-type"
            className={s.select}
            value={certType}
            onChange={(e) => setCertType(e.target.value as CertTypeKey)}
          >
            {CERT_TYPES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.labelEn ?? c.key}
                {uploadedKeys.has(c.key) ? " · re-upload" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className={s.fieldRow}>
          <label className={s.fieldLbl} htmlFor="cert-file">
            File
          </label>
          <input
            ref={fileInputRef}
            id="cert-file"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp,image/heic"
            className={s.fileInput}
            onChange={handleFileChange}
          />
        </div>

        {filename && <div className={s.filenameHint}>Selected: {filename}</div>}
        {isReupload && (
          <div className={s.reuploadHint}>
            This will replace your existing upload and reset the verification
            status to Pending.
          </div>
        )}

        {error && <div className={s.errMsg}>{error}</div>}

        <div className={s.footer}>
          <button type="button" className={s.btn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={handleSubmit}
            disabled={pending || !filename}
          >
            {pending ? "Uploading…" : isReupload ? "Re-upload" : "Upload"}
          </button>
        </div>
      </div>
    </>
  );
}
