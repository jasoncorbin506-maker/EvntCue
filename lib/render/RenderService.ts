/**
 * Render provider abstraction for the Mood Board AI render pipeline (Chunk D).
 *
 * Per Lock 17 thin-wrapper architecture: this file is the single swap surface
 * if we ever change render providers. The public surface (RenderInput,
 * RenderOutcome, RenderError, runRender, pollRender) is provider-agnostic;
 * the Replicate-specific URL, request shape, and response parsing are
 * internal to this file.
 *
 * Provider locked 2026-05-22: Replicate (Flux 2 Pro). See refreshed
 * Backstage/product/moodboard/cc-handoff-moodboard-wrapper.md Refresh log
 * for the re-check rationale.
 *
 * Pattern mirrors lib/moodboard/apify-client.ts: raw fetch, dependency-free,
 * typed errors, single env-var token. `server-only` import is dropped so the
 * companion test file can run under node:test + --experimental-strip-types
 * (per the pinterest-import.ts precedent — the only runtime caller is a
 * server action with "use server", which is sufficient to keep the
 * REPLICATE_API_TOKEN read off the client bundle).
 */

// =============================================================================
// PUBLIC SURFACE
// =============================================================================

/** Flux 2 Pro supported aspect ratios. */
export type AspectRatio =
  | "1:1"
  | "16:9"
  | "9:16"
  | "4:3"
  | "3:4"
  | "21:9"
  | "9:21";

/** Output image format. webp is smallest at comparable quality — preferred for
 *  re-hosting + signed-URL display per Lock 18. */
export type OutputFormat = "webp" | "jpg" | "png";

/** Provider-agnostic render input. The caller (server action) is responsible
 *  for prompt assembly per Lock 21 (editorial-lexicon prepend + banned-vocab
 *  negation + slot-fill logic) — this layer just runs it. */
export interface RenderInput {
  prompt: string;
  aspectRatio?: AspectRatio;
  outputFormat?: OutputFormat;
  /** Replicate Flux safety tolerance: 1 (strict) to 6 (permissive). */
  safetyTolerance?: number;
  seed?: number;
  /** Flux Pro's prompt-upsampling. Default off for predictable output. */
  promptUpsampling?: boolean;
}

/** Successful render — imageUrl is the provider's CDN (temporary, ~1h).
 *  Lock 18 durability is the caller's responsibility (re-host to private
 *  Supabase Storage). */
export interface RenderSuccess {
  status: "succeeded";
  providerJobId: string;
  imageUrl: string;
  startedAt: string | null;
  completedAt: string | null;
}

/** Render still in flight — caller stores providerJobId on the render_jobs
 *  row and polls via pollRender() until succeeded or timed out. */
export interface RenderProcessing {
  status: "processing";
  providerJobId: string;
}

/** Discriminated union — succeeded or still-in-flight. Failures throw RenderError. */
export type RenderOutcome = RenderSuccess | RenderProcessing;

/** Stable error codes for caller-side branching. */
export type RenderErrorCode =
  | "missing_token"
  | "invalid_input"
  | "auth_failed"
  | "rate_limited"
  | "provider_error"
  | "render_failed"
  | "render_canceled"
  | "fetch_failed"
  | "unexpected_response";

export class RenderError extends Error {
  readonly code: RenderErrorCode;
  readonly providerJobId: string | null;
  readonly status: number | null;

  constructor(
    code: RenderErrorCode,
    message: string,
    opts?: { providerJobId?: string; status?: number; cause?: unknown },
  ) {
    super(message, opts?.cause ? { cause: opts.cause } : undefined);
    this.name = "RenderError";
    this.code = code;
    this.providerJobId = opts?.providerJobId ?? null;
    this.status = opts?.status ?? null;
  }
}

export interface RenderClientOptions {
  /** Injectable for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Submit a render job and wait synchronously for completion (up to
 * SYNC_WAIT_SECONDS). Replicate's `Prefer: wait` header holds the request
 * open until the prediction completes or the window elapses; if it elapses,
 * we return { status: "processing" } and the caller polls.
 */
export async function runRender(
  input: RenderInput,
  options: RenderClientOptions = {},
): Promise<RenderOutcome> {
  const token = requireToken();
  validateInput(input);

  const fetchImpl = options.fetchImpl ?? fetch;
  const body = buildReplicateRequestBody(input);

  let response: Response;
  try {
    response = await fetchImpl(REPLICATE_CREATE_PREDICTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: `wait=${SYNC_WAIT_SECONDS}`,
      },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new RenderError("fetch_failed", "Network error reaching Replicate", {
      cause,
    });
  }

  return parsePredictionResponse(response);
}

/**
 * Poll an in-flight render job by its providerJobId. Same outcome shape as
 * runRender — caller treats both functions interchangeably for status checks.
 */
export async function pollRender(
  providerJobId: string,
  options: RenderClientOptions = {},
): Promise<RenderOutcome> {
  const token = requireToken();
  if (!providerJobId) {
    throw new RenderError("invalid_input", "providerJobId is required");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${REPLICATE_PREDICTION_URL_BASE}/${encodeURIComponent(providerJobId)}`;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (cause) {
    throw new RenderError("fetch_failed", "Network error polling Replicate", {
      providerJobId,
      cause,
    });
  }

  return parsePredictionResponse(response);
}

// =============================================================================
// REPLICATE-SPECIFIC INTERNALS (the swap surface)
// =============================================================================

const REPLICATE_CREATE_PREDICTION_URL =
  "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions";

const REPLICATE_PREDICTION_URL_BASE =
  "https://api.replicate.com/v1/predictions";

/** Sync wait window. Replicate falls back to async (returns status="processing")
 *  if rendering exceeds this. Flux 2 Pro typical render is 3–6s; 30s is a
 *  comfortable ceiling that fails fast on hangs without giving up on the
 *  long-tail healthy paths. */
const SYNC_WAIT_SECONDS = 30;

/** Internal: Replicate's prediction response shape (POST + GET return the same). */
interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: string | string[] | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
}

function requireToken(): string {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || token.trim().length === 0) {
    throw new RenderError(
      "missing_token",
      "REPLICATE_API_TOKEN is not set. Add it to .env.local (local) or Vercel env (deployed).",
    );
  }
  return token;
}

function validateInput(input: RenderInput): void {
  if (!input.prompt || input.prompt.trim().length === 0) {
    throw new RenderError(
      "invalid_input",
      "prompt is required and must be non-empty",
    );
  }
  if (input.safetyTolerance !== undefined) {
    if (
      !Number.isInteger(input.safetyTolerance) ||
      input.safetyTolerance < 1 ||
      input.safetyTolerance > 6
    ) {
      throw new RenderError(
        "invalid_input",
        "safetyTolerance must be an integer 1-6",
      );
    }
  }
}

function buildReplicateRequestBody(input: RenderInput): {
  input: Record<string, unknown>;
} {
  const replicateInput: Record<string, unknown> = { prompt: input.prompt };
  if (input.aspectRatio) replicateInput.aspect_ratio = input.aspectRatio;
  if (input.outputFormat) replicateInput.output_format = input.outputFormat;
  if (input.safetyTolerance !== undefined) {
    replicateInput.safety_tolerance = input.safetyTolerance;
  }
  if (input.seed !== undefined) replicateInput.seed = input.seed;
  if (input.promptUpsampling !== undefined) {
    replicateInput.prompt_upsampling = input.promptUpsampling;
  }
  return { input: replicateInput };
}

async function parsePredictionResponse(
  response: Response,
): Promise<RenderOutcome> {
  if (response.status === 401 || response.status === 403) {
    throw new RenderError(
      "auth_failed",
      `Replicate rejected authentication (${response.status}) — check REPLICATE_API_TOKEN`,
      { status: response.status },
    );
  }
  if (response.status === 429) {
    throw new RenderError("rate_limited", "Replicate rate limit hit (429)", {
      status: response.status,
    });
  }
  if (response.status >= 500) {
    throw new RenderError("provider_error", `Replicate ${response.status}`, {
      status: response.status,
    });
  }
  if (response.status >= 400) {
    let detail = "";
    try {
      detail = (await response.text()).slice(0, 200);
    } catch {
      // ignore parse failure — surface a generic message
    }
    throw new RenderError(
      "unexpected_response",
      `Replicate ${response.status}: ${detail}`,
      { status: response.status },
    );
  }

  let prediction: ReplicatePrediction;
  try {
    prediction = (await response.json()) as ReplicatePrediction;
  } catch (cause) {
    throw new RenderError(
      "unexpected_response",
      "Failed to parse Replicate response as JSON",
      { status: response.status, cause },
    );
  }

  if (!prediction.id || !prediction.status) {
    throw new RenderError(
      "unexpected_response",
      "Replicate response missing id or status",
      { status: response.status },
    );
  }

  if (prediction.status === "failed") {
    throw new RenderError(
      "render_failed",
      prediction.error ?? "Replicate prediction failed without error message",
      { providerJobId: prediction.id },
    );
  }
  if (prediction.status === "canceled") {
    throw new RenderError(
      "render_canceled",
      "Replicate prediction was canceled",
      { providerJobId: prediction.id },
    );
  }
  if (prediction.status === "starting" || prediction.status === "processing") {
    return { status: "processing", providerJobId: prediction.id };
  }

  // status === "succeeded"
  const imageUrl = extractImageUrl(prediction.output);
  if (!imageUrl) {
    throw new RenderError(
      "unexpected_response",
      "Replicate succeeded but output had no image URL",
      { providerJobId: prediction.id },
    );
  }

  return {
    status: "succeeded",
    providerJobId: prediction.id,
    imageUrl,
    startedAt: prediction.started_at,
    completedAt: prediction.completed_at,
  };
}

function extractImageUrl(output: ReplicatePrediction["output"]): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
  }
  return null;
}
