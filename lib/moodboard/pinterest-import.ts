import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Mood Board Chunk C — fetch a Pinterest image server-side and re-host it
 * to the private `mood-board-renders` Supabase Storage bucket.
 *
 * Why re-host instead of hot-link:
 *   1. Lock 18 visibility — we own the bytes; Pinterest can't observe who
 *      views our pins.
 *   2. Link rot — Pinterest CDN URLs go stale.
 *   3. Consistency with the upload path — same render code on the canvas.
 *
 * Pure helper; no DB writes. Returns the storage path + a 1h signed URL
 * for immediate render. The caller (import-pinterest-url server action)
 * is responsible for the `mood_board_pins` INSERT.
 */

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — matches bucket file_size_limit + upload path
const ALLOWED_EXTS = new Set(["jpeg", "jpg", "png", "webp", "heic"]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export type RehostInput = {
  sourceUrl: string;
  tenantId: string;
  boardId: string;
  supabase: SupabaseClient;
  /** Override fetch — used by tests. Defaults to global fetch. */
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
  const fetcher = input.fetchImpl ?? fetch;

  // 1. Fetch the image with size check.
  const response = await fetcher(input.sourceUrl, {
    headers: { "User-Agent": "EvntCue/1.0 (+https://evntcue.com)" },
  });
  if (!response.ok) {
    throw new RehostError(
      `Pinterest returned ${response.status}`,
      "fetch_failed",
    );
  }

  const contentLengthHeader = response.headers.get("content-length");
  const contentLength = contentLengthHeader
    ? parseInt(contentLengthHeader, 10)
    : 0;
  if (contentLength > MAX_BYTES) {
    throw new RehostError("Image too large (>10MB)", "too_large");
  }

  const contentType = (response.headers.get("content-type") ?? "image/jpeg")
    .split(";")[0]
    .trim()
    .toLowerCase();

  // 2. Determine extension from content-type. Tolerate Pinterest serving
  //    weird headers; reject only if extension fails our allowlist.
  const ext = MIME_TO_EXT[contentType] ?? contentType.split("/")[1] ?? "";
  if (!ALLOWED_EXTS.has(ext)) {
    throw new RehostError(
      `Unsupported image type: ${contentType}`,
      "unsupported_type",
    );
  }
  const normalizedExt = ext === "jpeg" ? "jpg" : ext;

  // 3. Read bytes; double-check size when the server lied about content-length.
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    throw new RehostError("Image too large (>10MB)", "too_large");
  }
  const buffer = Buffer.from(arrayBuffer);

  // 4. Upload to Storage. Path mirrors upload-image.ts:
  //    `${tenant_id}/${board_id}/${randomUUID()}.${ext}`
  const storagePath = `${input.tenantId}/${input.boardId}/${randomUUID()}.${normalizedExt}`;

  const { error: uploadErr } = await input.supabase.storage
    .from("mood-board-renders")
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });
  if (uploadErr) {
    throw new RehostError(
      `Upload failed: ${uploadErr.message}`,
      "upload_failed",
    );
  }

  // 5. Mint a 1h signed URL for immediate client render.
  const { data: signed, error: signErr } = await input.supabase.storage
    .from("mood-board-renders")
    .createSignedUrl(storagePath, 60 * 60);
  if (signErr || !signed?.signedUrl) {
    throw new RehostError(
      `Signed URL failed: ${signErr?.message ?? "unknown"}`,
      "signed_url_failed",
    );
  }

  return {
    storagePath,
    signedUrl: signed.signedUrl,
    sizeBytes: arrayBuffer.byteLength,
  };
}
