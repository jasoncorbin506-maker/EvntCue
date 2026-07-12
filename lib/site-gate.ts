/**
 * Private-preview gate (pre-launch). When SITE_ACCESS_CODE is set in the
 * environment, the proxy bounces every page request without the gate cookie
 * to /gate, where entering the code sets it. Unset the env var to reopen the
 * site — no code change needed.
 *
 * The cookie stores a SHA-256 digest of the code (never the code itself), so
 * rotating SITE_ACCESS_CODE invalidates every cookie issued for the old one.
 * WebCrypto only — this runs in both the edge proxy and the server action.
 */

export const GATE_COOKIE = "evntcue_gate";

/** 30 days — long enough to not nag testers, short enough to expire strays. */
export const GATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function gateCookieValue(accessCode: string): Promise<string> {
  const bytes = new TextEncoder().encode(`evntcue-gate-v1:${accessCode}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Only same-site destinations survive the round-trip through /gate?next=. */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
