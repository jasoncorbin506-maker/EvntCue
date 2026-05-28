/**
 * Shared email layout + components for all EvntCue transactional mail.
 *
 * Design language — "editorial stationery":
 *   - Warm ivory canvas, soft-white card, deep-navy ink (the app's `--ink`).
 *   - Cormorant Garamond italic for the warm moment (headline); Barlow for
 *     functional copy. Web fonts load via @import where the client allows it
 *     (Apple Mail / iOS), with Georgia / Helvetica fallbacks everywhere else.
 *   - One portal accent per send (Lock 18 colors) — coral for Vndr, etc.
 *
 * Email-client safety:
 *   - Table-based scaffold, inline styles, bulletproof button, hidden
 *     preheader, `color-scheme: light` to suppress ugly auto-dark inversion.
 *   - The <style> block is progressive enhancement only (mobile padding +
 *     font swap); every rule has an inline fallback so Gmail/Outlook degrade
 *     gracefully.
 *
 * Intentionally NOT `server-only`: these are pure string builders (no secrets,
 * no DB, no Resend). Keeping them pure lets us snapshot-test and preview-render
 * them in a plain Node script. The server boundary stays on lib/email/send.ts
 * and the call sites that touch Supabase.
 *
 * Phase 1 transactional templates (welcome / verify / reset) reuse this module
 * — that's why the accent + footer are parameterized.
 */

// ── Brand tokens ─────────────────────────────────────────────────────────────

const INK = "#1F2533"; // deep navy — matches the app wordmark
const INK_SOFT = "#4A4A4A";
const MUTED = "#8A8276";
const FAINT = "#9A8F7C";
const CANVAS = "#F2EDE4"; // warm ivory page background
const CARD = "#FFFDF8"; // soft warm white
const CARD_TINT = "#FBF8F2"; // inset panels
const HAIRLINE = "#EBE3D6";
const HAIRLINE_SOFT = "#EFE8DB";

const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Barlow', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Brand lockup (constellation mark + EvntCue wordmark), transparent PNG served
 * from the prod public/ dir so it blends seamlessly on the card (and in dark
 * mode). Absolute URL is required for email; resolves once this ships to main.
 * Asset: public/brand/evntcue-lockup.png (880×277, ~3.18:1).
 */
const LOGO_URL = "https://evntcue.com/brand/evntcue-lockup.png";

/** Lock 18 portal accents. `color` = the action/emphasis hue. */
export const EMAIL_ACCENTS = {
  vndr: "#E8622A", // coral
  catr: "#C98A1A", // amber
  venu: "#2A6BDB", // bay blue
  plnr: "#8B5FB8", // violet
  orgnz: "#D4778A", // rose
  neutral: "#1F2533",
} as const;

export type EmailAccentKey = keyof typeof EMAIL_ACCENTS;

// ── Content components ───────────────────────────────────────────────────────

/** Small uppercase label above the headline. */
export function eyebrow(text: string, accent: string = EMAIL_ACCENTS.vndr): string {
  return `<p style="margin:0 0 12px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.20em;text-transform:uppercase;color:${accent};">${text}</p>`;
}

/** The warm moment — Cormorant italic. */
export function headline(text: string): string {
  return `<h1 class="ec-h1" style="margin:0 0 18px;font-family:${SERIF};font-style:italic;font-weight:600;font-size:31px;line-height:1.18;color:${INK};">${text}</h1>`;
}

/** Functional body copy. `html` may contain inline tags (e.g. <b>). */
export function paragraph(html: string): string {
  return `<p style="margin:0 0 18px;font-family:${SANS};font-size:15px;line-height:1.66;color:${INK_SOFT};">${html}</p>`;
}

/** Quiet supporting line (e.g. the response window). */
export function subtle(html: string): string {
  return `<p style="margin:0 0 22px;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTED};">${html}</p>`;
}

/** A pulled quote — Cormorant italic with an accent rule. Optional attribution. */
export function quote(text: string, accent: string = EMAIL_ACCENTS.vndr, attribution?: string): string {
  const attr = attribution
    ? `<p style="margin:8px 0 0;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${FAINT};">${attribution}</p>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td style="padding:2px 0 2px 18px;border-left:3px solid ${accent};">
<p style="margin:0;font-family:${SERIF};font-style:italic;font-size:18px;line-height:1.5;color:#5A5346;">&ldquo;${text}&rdquo;</p>${attr}
</td></tr></table>`;
}

/** Bulletproof pill button. */
export function button(args: { href: string; label: string; accent?: string }): string {
  const accent = args.accent ?? EMAIL_ACCENTS.vndr;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;"><tr>
<td align="center" bgcolor="${accent}" style="border-radius:999px;mso-padding-alt:14px 32px;">
<a href="${args.href}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 32px;font-family:${SANS};font-size:14px;font-weight:600;letter-spacing:0.03em;color:#FFFFFF;text-decoration:none;border-radius:999px;">${args.label}</a>
</td></tr></table>`;
}

/** Thin inset divider for use inside the content block. */
export function divider(): string {
  return `<div style="height:1px;background:${HAIRLINE};margin:6px 0 22px;"></div>`;
}

// ── Document shell ───────────────────────────────────────────────────────────

function wordmark(size: number, color: string = INK): string {
  return `<span style="font-family:${SERIF};font-style:italic;font-weight:600;font-size:${size}px;color:${color};letter-spacing:0.01em;">Evnt</span><span style="font-family:${SANS};font-weight:600;font-size:${Math.round(
    size * 0.92,
  )}px;color:${color};letter-spacing:0.02em;">Cue</span>`;
}

/**
 * Wrap content in the full branded document.
 *
 * @param preheader  Inbox preview snippet (kept visually hidden).
 * @param footerNote One-line "why you're receiving this" (locale-specific).
 * @param children   Pre-rendered content HTML (use the helpers above — they
 *                   each take their own accent so the shell stays neutral).
 */
export function emailShell(args: {
  preheader: string;
  footerNote: string;
  children: string;
  lang?: "en" | "es";
}): string {
  const lang = args.lang ?? "en";
  return `<!doctype html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>EvntCue</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Barlow:wght@400;500;600&display=swap');
body{margin:0;padding:0;width:100%!important;background:${CANVAS};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
img{border:0;line-height:100%;outline:none;text-decoration:none;}
table{border-collapse:collapse;}
a{text-decoration:none;}
@media only screen and (max-width:600px){
  .ec-pad{padding-left:26px!important;padding-right:26px!important;}
  .ec-h1{font-size:27px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background:${CANVAS};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent;height:0;width:0;">${args.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};">
<tr><td align="center" style="padding:34px 16px 40px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${CARD};border:1px solid ${HAIRLINE};border-radius:18px;overflow:hidden;box-shadow:0 14px 40px rgba(31,37,51,0.08);">
<tr><td class="ec-pad" align="center" style="padding:36px 44px 16px;"><img src="${LOGO_URL}" width="220" height="69" alt="EvntCue" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;width:220px;height:auto;"></td></tr>
<tr><td class="ec-pad" style="padding:0 44px;"><div style="height:1px;background:${HAIRLINE};"></div></td></tr>
<tr><td class="ec-pad" style="padding:34px 44px 10px;">${args.children}</td></tr>
<tr><td class="ec-pad" style="padding:8px 44px 0;"><div style="height:1px;background:${HAIRLINE_SOFT};"></div></td></tr>
<tr><td class="ec-pad" align="center" style="padding:22px 44px 36px;">
<div style="margin:0 0 8px;">${wordmark(15, MUTED)}</div>
<p style="margin:0 0 4px;font-family:${SANS};font-size:11.5px;line-height:1.6;color:${FAINT};">${args.footerNote}</p>
<p style="margin:0;font-family:${SANS};font-size:11px;letter-spacing:0.04em;color:#B6AD9C;">EvntCue &middot; Dallas&ndash;Fort Worth, Texas</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Notification-specific block (used by event-notifications.ts) ─────────────

/**
 * The before/after date panel. `was` is struck through; `now` is emphasized in
 * the accent. Both already locale-formatted by the caller.
 */
export function dateChangePanel(args: {
  wasLabel: string;
  nowLabel: string;
  was: string;
  now: string;
  accent?: string;
}): string {
  const accent = args.accent ?? EMAIL_ACCENTS.vndr;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;border:1px solid ${HAIRLINE};border-radius:12px;background:${CARD_TINT};">
<tr><td style="padding:14px 18px;border-bottom:1px solid ${HAIRLINE_SOFT};">
<span style="display:block;font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${FAINT};margin-bottom:4px;">${args.wasLabel}</span>
<span style="font-family:${SANS};font-size:15px;color:${MUTED};text-decoration:line-through;text-decoration-color:#CBC1AE;">${args.was}</span>
</td></tr>
<tr><td style="padding:14px 18px;">
<span style="display:block;font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${accent};margin-bottom:4px;">${args.nowLabel}</span>
<span style="font-family:${SANS};font-size:17px;font-weight:600;color:${INK};">${args.now}</span>
</td></tr>
</table>`;
}
