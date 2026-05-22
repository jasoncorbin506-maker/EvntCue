/**
 * Client-side classifier for Pinterest URLs.
 *
 * Pin URLs:    https://www.pinterest.com/pin/<numeric-id>/
 *              https://pin.it/<short>            (short URL — resolved server-side by Apify)
 *
 * Board URLs:  https://www.pinterest.com/<user>/<board-slug>/
 *              https://www.pinterest.com/user/<user>/<board-slug>/  (alternate)
 *
 * Anything else is `invalid`.
 *
 * v1 deviation from the brief's C-2: we do NOT make a "preview" Apify call
 * for board URLs (the recommended actor doesn't expose pin counts cheaply,
 * and a preview call would burn 30-60s + credit). Instead, classification
 * is purely structural — we tell the user "this looks like a board" up
 * front, run the import on confirm, and report the actual count + cap
 * status afterward.
 */

export type PinterestUrlKind = "pin" | "board" | "invalid";

const PIN_PATH_PATTERN = /^\/pin\/[\w-]+\/?$/;
const SHORT_HOST = "pin.it";
/** Board path examples:
 *    /username/board-slug/
 *    /user/username/board-slug/
 *  We reject the bare /username/ (profile) — the brief targets boards only. */
const BOARD_PATH_PATTERN = /^\/(user\/)?[\w.-]+\/[\w.-]+\/?$/;

const PINTEREST_HOSTS = new Set([
  "pinterest.com",
  "www.pinterest.com",
  "pinterest.ca",
  "www.pinterest.ca",
  "pinterest.co.uk",
  "www.pinterest.co.uk",
  "pinterest.de",
  "www.pinterest.de",
  "pinterest.fr",
  "www.pinterest.fr",
  "pinterest.au",
  "www.pinterest.au",
  "pinterest.com.au",
  "www.pinterest.com.au",
  "pinterest.jp",
  "www.pinterest.jp",
  "pinterest.mx",
  "www.pinterest.mx",
  "pinterest.es",
  "www.pinterest.es",
  "pinterest.it",
  "www.pinterest.it",
  "pinterest.pt",
  "www.pinterest.pt",
  "pinterest.nl",
  "www.pinterest.nl",
]);

export function classifyPinterestUrl(raw: string): PinterestUrlKind {
  const trimmed = raw.trim();
  if (!trimmed) return "invalid";

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "invalid";
  }

  const host = parsed.hostname.toLowerCase();

  if (host === SHORT_HOST) {
    // pin.it short URLs are always single-pin shortlinks.
    return parsed.pathname.length > 1 ? "pin" : "invalid";
  }

  if (!PINTEREST_HOSTS.has(host)) return "invalid";

  const path = parsed.pathname;
  if (PIN_PATH_PATTERN.test(path)) return "pin";
  if (BOARD_PATH_PATTERN.test(path)) return "board";
  return "invalid";
}
