/**
 * MediaService — shared types + per-kind policy.
 *
 * This is the CSAM-safety chokepoint's vocabulary. Every media upload in the
 * app routes through MediaService (lib/media/index.ts); these types describe
 * what it accepts and what it returns.
 *
 * The detection layer is NOT wired yet — `scan()` is a no-op that returns
 * `clean` (see lib/media/scanner.ts). The seam is provider-agnostic so that
 * PhotoDNA, Hive (Thorn known/novel + nudity), or both drop in behind one
 * interface once a provider is chosen. Nothing below assumes a vendor.
 */

/** Every distinct kind of media the app ingests. One door, many kinds. */
export type MediaKind =
  | "vendor_photo"
  | "catr_photo"
  | "venue_photo"
  | "planner_photo"
  | "mood_board_pin"
  | "vendor_cert";

/**
 * Intended visibility of the stored object. `public` resolves to a public URL
 * (public bucket); `private` resolves to a short-lived signed URL.
 *
 * NOTE on promote-on-pass: today every kind is uploaded straight to its bucket
 * because scan() always returns `clean`. When real detection lands, a non-clean
 * verdict must prevent a `public` object from ever becoming reachable — see the
 * verdict handling in MediaService.ingest*. The visibility field is what later
 * lets the funnel decide "do not expose this yet."
 */
export type MediaVisibility = "public" | "private";

/** Outcome of a scan. `clean` is the only status that promotes to visible. */
export type ScanStatus = "clean" | "flagged" | "pending" | "error";

export type ScanVerdict = {
  status: ScanStatus;
  /** Which providers ran (e.g. "photodna", "hive_csam", "hive_nudity"). Empty for no-op. */
  sources: string[];
  /** Highest match score across providers, when applicable. */
  score?: number;
  /** Free-form provider detail, persisted to media_scan_matches when the ledger is live. */
  detail?: Record<string, unknown>;
};

export type IngestErrorCode =
  | "too_large"
  | "unsupported_type"
  | "fetch_failed"
  | "upload_failed"
  | "url_failed"
  | "flagged" // scan returned not-clean; object withheld from visible state
  | "internal";

export type IngestSuccess = {
  ok: true;
  bucket: string;
  storagePath: string;
  /** Public URL (public kinds) or signed URL (private kinds). Safe to render. */
  url: string;
  byteSize: number;
  contentType: string;
  verdict: ScanVerdict;
};

export type IngestFailure = {
  ok: false;
  code: IngestErrorCode;
  error: string;
};

export type IngestResult = IngestSuccess | IngestFailure;

/** Per-kind ingest policy. The single source of truth for limits + destination. */
export type MediaPolicy = {
  bucket: string;
  visibility: MediaVisibility;
  maxBytes: number;
  /** Allowed content-types. */
  allowedMime: readonly string[];
  /** Human label used in validation messages. */
  noun: string;
};

const MB = 1024 * 1024;

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const IMAGE_MIME_HEIC = [...IMAGE_MIME, "image/heic"] as const;
const DOC_MIME = ["application/pdf", ...IMAGE_MIME_HEIC] as const;

/**
 * Limits mirror the values previously duplicated across each upload action
 * (verified 2026-06-07): photos 5 MB jpeg/png/webp → public buckets; mood-board
 * 10 MB +heic → private; certs 10 MB +pdf → private (shares mood-board-renders).
 */
export const MEDIA_POLICY: Record<MediaKind, MediaPolicy> = {
  vendor_photo: {
    bucket: "vendor-photos",
    visibility: "public",
    maxBytes: 5 * MB,
    allowedMime: IMAGE_MIME,
    noun: "Image",
  },
  catr_photo: {
    bucket: "catr-photos",
    visibility: "public",
    maxBytes: 5 * MB,
    allowedMime: IMAGE_MIME,
    noun: "Image",
  },
  venue_photo: {
    bucket: "venue-photos",
    visibility: "public",
    maxBytes: 5 * MB,
    allowedMime: IMAGE_MIME,
    noun: "Image",
  },
  planner_photo: {
    bucket: "planner-photos",
    visibility: "public",
    maxBytes: 5 * MB,
    allowedMime: IMAGE_MIME,
    noun: "Image",
  },
  mood_board_pin: {
    bucket: "mood-board-renders",
    visibility: "private",
    maxBytes: 10 * MB,
    allowedMime: IMAGE_MIME_HEIC,
    noun: "Image",
  },
  vendor_cert: {
    bucket: "mood-board-renders",
    visibility: "private",
    maxBytes: 10 * MB,
    allowedMime: DOC_MIME,
    noun: "File",
  },
};

export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
};
