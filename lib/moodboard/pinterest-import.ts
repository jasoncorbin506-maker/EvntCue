import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ingestFromUrl } from "../media/index.ts";

/**
 * Mood Board Chunk C — fetch a remote image (Pinterest pin, or an AI render
 * provider's output) server-side and re-host it to the private
 * `mood-board-renders` bucket.
 *
 * As of the MediaService chokepoint (2026-06-07) this is a thin wrapper over
 * MediaService.ingestFromUrl — so re-hosted images get the same validation +
 * (future) CSAM/nudity scan as direct uploads. The funnel owns the fetch,
 * size/type checks, scan, upload, and signed URL; this wrapper only preserves
 * the historical RehostInput/RehostResult/RehostError surface its callers use.
 *
 * Why re-host instead of hot-link: Lock 18 visibility (we own the bytes),
 * link rot (provider CDNs go stale), and one code path on the canvas.
 *
 * Pure-ish helper; no DB writes. The caller (import-pinterest-url server
 * action / finalize-render) is responsible for the `mood_board_pins` INSERT.
 */

export type RehostInput = {
  sourceUrl: string;
  tenantId: string;
  boardId: string;
  /** Authed user id — recorded as upload provenance in the moderation ledger. */
  uploadedBy: string;
  /**
   * @deprecated MediaService uses its own service-role client; retained so
   * existing call sites compile unchanged.
   */
  supabase?: SupabaseClient;
  /** Override fetch — used by tests. Forwarded to MediaService. */
  fetchImpl?: typeof fetch;
};

export type RehostResult = {
  storagePath: string;
  signedUrl: string;
  sizeBytes: number;
};

export class RehostError extends Error {
  code:
    | "fetch_failed"
    | "too_large"
    | "unsupported_type"
    | "upload_failed"
    | "signed_url_failed";
  constructor(message: string, code: RehostError["code"]) {
    super(message);
    this.code = code;
    this.name = "RehostError";
  }
}

export async function fetchAndRehostImage(
  input: RehostInput,
): Promise<RehostResult> {
  // Path convention preserved: `${tenant_id}/${board_id}/${randomUUID()}.${ext}`.
  // The funnel appends the extension from the fetched content-type.
  const objectKeyPrefix = `${input.tenantId}/${input.boardId}/${randomUUID()}`;

  const result = await ingestFromUrl({
    kind: "mood_board_pin",
    objectKeyPrefix,
    sourceUrl: input.sourceUrl,
    tenantId: input.tenantId,
    uploadedBy: input.uploadedBy,
    fetchImpl: input.fetchImpl,
    // Callers (and tests) already hold a client; forward it so the funnel
    // doesn't instantiate a second one and tests can inject a stub.
    adminClient: input.supabase,
  });

  if (!result.ok) {
    // Map funnel error codes back onto the historical RehostError union so
    // callers' existing switch/handling keeps working.
    const code: RehostError["code"] =
      result.code === "url_failed"
        ? "signed_url_failed"
        : result.code === "fetch_failed" ||
            result.code === "too_large" ||
            result.code === "unsupported_type" ||
            result.code === "upload_failed"
          ? result.code
          : "upload_failed";
    throw new RehostError(result.error, code);
  }

  return {
    storagePath: result.storagePath,
    signedUrl: result.url,
    sizeBytes: result.byteSize,
  };
}
