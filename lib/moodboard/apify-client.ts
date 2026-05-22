import "server-only";

/**
 * Thin wrapper around Apify's REST API for the Pinterest scraper actor.
 *
 * We're not using the `apify-client` npm package — raw fetch keeps the
 * dependency footprint flat and the swap surface tiny if Apify ever
 * changes auth/endpoint shape. Per the canvas-stack-correction lock:
 * "thin wrapper, fat pipe."
 *
 * Default actor: `automation-lab/pinterest-scraper` (verified live
 * 2026-05-22 evening — flat response shape, `imageUrl` at top level).
 * Fallbacks if it ever 404s: `silentflow/pinterest-scraper`,
 * `scrapers-hub/pinterest-user-scraper`.
 */

const APIFY_BASE = "https://api.apify.com/v2";
const DEFAULT_ACTOR = "automation-lab~pinterest-scraper";
const DEFAULT_TIMEOUT_SECS = 60;

/** Shape of a single item returned by `automation-lab/pinterest-scraper`. */
export type ApifyPinterestItem = {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  isVideo?: boolean;
  boardName?: string;
  pinnerUsername?: string;
  dominantColor?: string;
};

export type ApifyRunInput = {
  startUrls: Array<{ url: string }>;
  /** Some actors honor a max-items field; the pinterest-scraper respects this
   *  loosely on the server side, so we also cap client-side after the call. */
  maxItems?: number;
};

export class ApifyError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApifyError";
  }
}

function requireToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new ApifyError(
      "APIFY_API_TOKEN is not set. Add it to .env.local (local) or Vercel env (deployed).",
      500,
    );
  }
  return token;
}

/**
 * Run the actor synchronously and return its dataset items.
 *
 * Apify's `run-sync-get-dataset-items` endpoint blocks until the actor
 * finishes. For 50+ pin board imports this can take 30-60s; v1 cap of
 * 100 per board keeps us under typical Vercel timeouts.
 */
export async function runPinterestScraper(
  input: ApifyRunInput,
  options?: { actor?: string; timeoutSecs?: number },
): Promise<ApifyPinterestItem[]> {
  const token = requireToken();
  const actor = options?.actor ?? DEFAULT_ACTOR;
  const timeoutSecs = options?.timeoutSecs ?? DEFAULT_TIMEOUT_SECS;

  const url = `${APIFY_BASE}/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${timeoutSecs}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ApifyError(
      `Apify actor returned ${response.status}: ${body.slice(0, 200)}`,
      response.status,
    );
  }

  const json = (await response.json()) as unknown;
  if (!Array.isArray(json)) {
    throw new ApifyError("Apify response was not an array", 500);
  }
  return json as ApifyPinterestItem[];
}
