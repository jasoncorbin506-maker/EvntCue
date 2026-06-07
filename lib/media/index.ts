/**
 * MediaService — the single door every media upload routes through.
 *
 * The CSAM-safety spine. One ordering law:
 *
 *     validate → scan → only-if-clean → upload → record → return visible URL
 *
 * Today scan() is a no-op returning `clean` (see scanner.ts), so this is
 * behavior-preserving vs the per-feature upload actions it replaces. When a
 * detector is wired, a non-clean verdict short-circuits BEFORE the object can
 * reach a visible state — default-private, promote-on-pass.
 *
 * Responsibility split:
 *   - MediaService: media validation (size/type), scan, storage upload, URL
 *     resolution, ledger record, and storage cleanup.
 *   - Callers keep: auth, domain caps (e.g. 12-photo limit), ownership checks,
 *     the domain DB row (vendor_photos / mood_board_pins / ...), and revalidate.
 *
 * Storage uses the service-role admin client (buckets are admin-written
 * everywhere today); provenance is preserved because callers stamp the authed
 * user id into their own domain row regardless of who runs the SQL.
 */

// Internal imports are RELATIVE with .ts extensions (not the @/ alias) so this
// module — and anything that depends on it, like the rehost helper — stays
// loadable by the raw-node unit-test runner (which doesn't resolve tsconfig
// paths). allowImportingTsExtensions is on, so Next/tsc accept this too.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../supabase/admin.ts";
import { getMediaScanner, type ScanInput } from "./scanner.ts";
import { getModerationStore } from "./moderation-store.ts";
import {
  MEDIA_POLICY,
  MIME_TO_EXT,
  type IngestResult,
  type MediaKind,
  type MediaVisibility,
} from "./types.ts";

export * from "./types.ts";
export { setMediaScanner, getMediaScanner } from "./scanner.ts";
export type { MediaScanner, ScanInput } from "./scanner.ts";
export {
  setModerationStore,
  getModerationStore,
  NoopModerationStore,
} from "./moderation-store.ts";
export type { ModerationStore, ModerationRecord } from "./moderation-store.ts";

const DEFAULT_SIGNED_TTL = 60 * 60; // 1h — matches prior upload paths

type Bytes = Buffer | ArrayBuffer | Uint8Array;

function toBuffer(bytes: Bytes): Buffer {
  if (Buffer.isBuffer(bytes)) return bytes;
  return Buffer.from(bytes as ArrayBuffer);
}

/** Map a content-type to a storage extension; "bin" if unknown. */
export function extForMime(contentType: string): string {
  return MIME_TO_EXT[contentType] ?? "bin";
}

export type IngestBytesInput = {
  kind: MediaKind;
  /** The object key WITHIN the bucket. Callers keep their own path conventions. */
  objectKey: string;
  contentType: string;
  bytes: Bytes;
  tenantId: string;
  /** Authed user id, for ledger provenance. */
  uploadedBy: string;
  /** Storage upsert (cert path uses true; everything else false). */
  upsert?: boolean;
  /** TTL for the signed URL when the kind is private. */
  signedUrlTtlSeconds?: number;
  /**
   * Override the service-role client used for storage + URL resolution.
   * Defaults to createAdminClient(). Callers that already hold an admin client
   * can pass it to avoid a second instantiation; tests inject a stub.
   */
  adminClient?: SupabaseClient;
};

export type IngestFromUrlInput = Omit<
  IngestBytesInput,
  "bytes" | "contentType" | "objectKey"
> & {
  sourceUrl: string;
  /**
   * Object key WITHOUT extension (e.g. `${tenant}/${board}/${uuid}`). The
   * extension is appended from the fetched content-type, since the remote
   * type isn't known until the fetch completes.
   */
  objectKeyPrefix: string;
  /** Override fetch — used by tests. */
  fetchImpl?: typeof fetch;
};

/**
 * Ingest in-memory bytes (the File-upload path: portfolio photos, mood-board
 * upload, certs).
 */
export async function ingestBytes(input: IngestBytesInput): Promise<IngestResult> {
  const policy = MEDIA_POLICY[input.kind];
  const buffer = toBuffer(input.bytes);

  // 1. validate against the single-source-of-truth policy.
  if (buffer.byteLength > policy.maxBytes) {
    const mb = Math.round(policy.maxBytes / (1024 * 1024));
    return { ok: false, code: "too_large", error: `${policy.noun} must be ${mb} MB or smaller.` };
  }
  if (!policy.allowedMime.includes(input.contentType)) {
    return {
      ok: false,
      code: "unsupported_type",
      error: `Unsupported file type. Allowed: ${policy.allowedMime.join(", ")}.`,
    };
  }

  return finalize({
    policy,
    kind: input.kind,
    objectKey: input.objectKey,
    contentType: input.contentType,
    buffer,
    tenantId: input.tenantId,
    uploadedBy: input.uploadedBy,
    upsert: input.upsert ?? false,
    signedUrlTtlSeconds: input.signedUrlTtlSeconds ?? DEFAULT_SIGNED_TTL,
    adminClient: input.adminClient,
  });
}

/**
 * Ingest by fetching a remote URL then re-hosting (Pinterest import, AI render
 * finalize). Mirrors the old fetchAndRehostImage tolerance for provider headers.
 */
export async function ingestFromUrl(input: IngestFromUrlInput): Promise<IngestResult> {
  const policy = MEDIA_POLICY[input.kind];
  const fetcher = input.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetcher(input.sourceUrl, {
      headers: { "User-Agent": "EvntCue/1.0 (+https://evntcue.com)" },
    });
  } catch (e) {
    return { ok: false, code: "fetch_failed", error: `Fetch failed: ${(e as Error).message}` };
  }
  if (!response.ok) {
    return { ok: false, code: "fetch_failed", error: `Source returned ${response.status}` };
  }

  const declaredLength = parseInt(response.headers.get("content-length") ?? "0", 10);
  if (declaredLength > policy.maxBytes) {
    const mb = Math.round(policy.maxBytes / (1024 * 1024));
    return { ok: false, code: "too_large", error: `${policy.noun} too large (>${mb}MB)` };
  }

  const contentType = (response.headers.get("content-type") ?? "image/jpeg")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!policy.allowedMime.includes(contentType)) {
    return { ok: false, code: "unsupported_type", error: `Unsupported image type: ${contentType}` };
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength > policy.maxBytes) {
    const mb = Math.round(policy.maxBytes / (1024 * 1024));
    return { ok: false, code: "too_large", error: `${policy.noun} too large (>${mb}MB)` };
  }

  const objectKey = `${input.objectKeyPrefix}.${extForMime(contentType)}`;

  return finalize({
    policy,
    kind: input.kind,
    objectKey,
    contentType,
    buffer,
    tenantId: input.tenantId,
    uploadedBy: input.uploadedBy,
    upsert: input.upsert ?? false,
    signedUrlTtlSeconds: input.signedUrlTtlSeconds ?? DEFAULT_SIGNED_TTL,
    adminClient: input.adminClient,
  });
}

type FinalizeArgs = {
  policy: (typeof MEDIA_POLICY)[MediaKind];
  kind: MediaKind;
  objectKey: string;
  contentType: string;
  buffer: Buffer;
  tenantId: string;
  uploadedBy: string;
  upsert: boolean;
  signedUrlTtlSeconds: number;
  adminClient?: SupabaseClient;
};

/** scan → only-if-clean → upload → record → resolve URL. The ordering law. */
async function finalize(args: FinalizeArgs): Promise<IngestResult> {
  const { policy, kind, objectKey, contentType, buffer, tenantId, uploadedBy } = args;
  const admin = args.adminClient ?? createAdminClient();

  // 2. SCAN — before the object touches a visible location.
  const scanInput: ScanInput = {
    bytes: buffer,
    contentType,
    kind,
    ref: { bucket: policy.bucket, storagePath: objectKey },
  };
  let verdict;
  try {
    verdict = await getMediaScanner().scan(scanInput);
  } catch (e) {
    return { ok: false, code: "internal", error: `Scan failed: ${(e as Error).message}` };
  }

  // 3. ONLY-IF-CLEAN. A non-clean verdict is withheld from any visible state.
  //    (No-op scanner always returns clean, so today this never trips. When a
  //    real provider lands, flagged/pending objects route to quarantine here
  //    instead of uploading to the live bucket — that work ships with the
  //    provider + the applied media_assets ledger.)
  if (verdict.status !== "clean") {
    return {
      ok: false,
      code: "flagged",
      error: "This file could not be accepted.",
    };
  }

  // 4. UPLOAD.
  const { error: uploadErr } = await admin.storage
    .from(policy.bucket)
    .upload(objectKey, buffer, { contentType, upsert: args.upsert });
  if (uploadErr) {
    return { ok: false, code: "upload_failed", error: `Upload failed: ${uploadErr.message}` };
  }

  // 5. RECORD to the moderation ledger (no-op until media_assets is applied).
  //    Never fails the upload — best-effort.
  try {
    await getModerationStore().record({
      bucket: policy.bucket,
      storagePath: objectKey,
      kind,
      tenantId,
      uploadedBy,
      byteSize: buffer.byteLength,
      contentType,
      visibility: policy.visibility,
      verdict,
    });
  } catch {
    // swallow — ledger write must not break a clean upload
  }

  // 6. RESOLVE the visible URL per the kind's visibility.
  const url = await resolveUrl(
    policy.bucket,
    objectKey,
    policy.visibility,
    args.signedUrlTtlSeconds,
    admin,
  );
  if (!url) {
    return { ok: false, code: "url_failed", error: "Could not resolve media URL." };
  }

  return {
    ok: true,
    bucket: policy.bucket,
    storagePath: objectKey,
    url,
    byteSize: buffer.byteLength,
    contentType,
    verdict,
  };
}

/** Public URL for public buckets; short-lived signed URL for private. */
export async function resolveUrl(
  bucket: string,
  storagePath: string,
  visibility: MediaVisibility,
  ttlSeconds: number = DEFAULT_SIGNED_TTL,
  client?: SupabaseClient,
): Promise<string | null> {
  const admin = client ?? createAdminClient();
  if (visibility === "public") {
    return admin.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl ?? null;
  }
  const { data } = await admin.storage.from(bucket).createSignedUrl(storagePath, ttlSeconds);
  return data?.signedUrl ?? null;
}

/**
 * Remove storage objects. Used by callers for best-effort cleanup when their
 * domain-row insert fails after a successful ingest.
 *
 * NOTE: this is NOT the user-facing delete path. Once the media_assets ledger
 * is applied, user-initiated deletes (delete-*-photo.ts, delete-pin.ts) must
 * route through a guarded MediaService.delete() that refuses when legal_hold /
 * quarantined is set (the deletion carve-out). That guard ships with the
 * migration — see the deploy/ draft.
 */
export async function removeObjects(bucket: string, paths: string[]): Promise<void> {
  const admin = createAdminClient();
  await admin.storage.from(bucket).remove(paths);
}
