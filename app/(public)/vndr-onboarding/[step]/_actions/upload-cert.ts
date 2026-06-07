"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { CERT_TYPES, type CertTypeKey } from "@/lib/labels/cert-types";
import { ingestBytes } from "@/lib/media";

/**
 * Stage 4 cert upload server action. Two side effects:
 *
 *   1. File uploads to the 'mood-board-renders' Supabase Storage bucket
 *      at path `vendors/{tenant_id}/{cert_type}.{ext}`. Bucket is private;
 *      reads use signed URLs (matches the mood-board pattern from session
 *      18g; the bucket already exists, no new bucket to create).
 *   2. Upsert into tenant_certifications: one row per (tenant_id, cert_type).
 *      Re-uploading the same cert_type overwrites the prior file + resets
 *      verified=false (staff re-verify on each new upload). The file_url
 *      column stores the bucket path (NOT a signed URL — those expire);
 *      consumers generate signed URLs on read.
 *
 * Per master spec §75 soft-gate semantics: this action NEVER blocks the
 * funnel. A vendor can finish Stage 4 with zero certs uploaded — the
 * Verified badge is the carrot, not a gate. finishOnboardingAction runs
 * regardless of what came through here.
 *
 * Storage uses the admin client to bypass bucket RLS (service role).
 * The tenant_certifications insert uses the RLS-scoped client — tc_insert
 * policy from migration 003 allows the owning tenant to write their own
 * rows.
 */

const VALID_CERT_KEYS = new Set<string>(CERT_TYPES.map((c) => c.key));

export type UploadCertResult =
  | { ok: true; certType: CertTypeKey }
  | { ok: false; error: string };

export async function uploadCertAction(
  formData: FormData,
): Promise<UploadCertResult> {
  const certTypeRaw = String(formData.get("certType") ?? "");
  if (!VALID_CERT_KEYS.has(certTypeRaw)) {
    return { ok: false, error: "Invalid certification type." };
  }
  const certType = certTypeRaw as CertTypeKey;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick a file to upload." };
  }

  const vendor = await getCurrentVendor();
  if (!vendor) {
    return { ok: false, error: "Your session expired. Sign in again." };
  }

  const supabase = await createClient();

  const ext =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "bin";
  const path = `vendors/${vendor.tenantId}/${certType}.${ext}`;

  // Funnel through MediaService (CSAM-safety chokepoint). vendor_cert policy:
  // 10 MB; pdf/png/jpeg/webp/heic; private `mood-board-renders` bucket. The
  // fixed per-cert key means re-upload overwrites (upsert), matching prior
  // behavior. We store the storage path (not a URL) on the row below.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ingest = await ingestBytes({
    kind: "vendor_cert",
    objectKey: path,
    contentType: file.type,
    bytes: await file.arrayBuffer(),
    tenantId: vendor.tenantId,
    uploadedBy: user?.id ?? vendor.tenantId,
    upsert: true,
  });
  if (!ingest.ok) {
    return { ok: false, error: ingest.error };
  }

  // Upsert tenant_certifications row. One row per (tenant_id, cert_type)
  // — re-upload overwrites + resets verified state.
  const { data: existing } = await supabase
    .from("tenant_certifications")
    .select("id")
    .eq("tenant_id", vendor.tenantId)
    .eq("cert_type", certType)
    .maybeSingle();

  if (existing) {
    const { error: updateErr } = await supabase
      .from("tenant_certifications")
      .update({
        file_url: path,
        verified: false,
        verified_at: null,
        verified_by: null,
        rejection_reason: null,
      })
      .eq("id", existing.id);
    if (updateErr) {
      return { ok: false, error: "Upload saved but record update failed." };
    }
  } else {
    const { error: insertErr } = await supabase
      .from("tenant_certifications")
      .insert({
        tenant_id: vendor.tenantId,
        cert_type: certType,
        file_url: path,
        verified: false,
      });
    if (insertErr) {
      return { ok: false, error: "Upload saved but record insert failed." };
    }
  }

  return { ok: true, certType };
}
