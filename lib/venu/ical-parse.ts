import "server-only";

/**
 * iCal feed parsing + URL validation. Server-only — node-ical is a Node
 * module that uses streams + buffers + DNS lookups.
 *
 * Note: node-ical is dynamically imported inside parseIcalText (not at
 * module top) to avoid Vercel's "collect page data" build phase eagerly
 * loading its transitive deps (rrule.js / axios), which currently trips
 * a Turbopack CommonJS interop bug ("TypeError: s.BigInt is not a
 * function" — surfaced 2026-05-27 first prod build). The runtime cost
 * of a single dynamic import per sync-feed call is negligible.
 *
 * Output is a normalized list of (UID, blocked_date, start_time, end_time,
 * reason) tuples that the sync worker writes directly to
 * venue_availability_blocks. Recurring events expanded to individual
 * occurrences over a forward 18-month window.
 *
 * Forward window only: we don't backfill past dates from an iCal feed
 * (organizers care about future availability; old events would create
 * noise without value). 18 months is comfortably longer than any sane
 * forward-booking horizon for a wedding/event venue.
 */

const FETCH_TIMEOUT_MS = 30_000;
const FORWARD_WINDOW_MONTHS = 18;
const USER_AGENT = "EvntCue Calendar Sync (+https://evntcue.com)";

export type ParsedEvent = {
  /** Stable identifier for re-sync dedup. iCal VEVENT UID. */
  uid: string;
  /** ISO date (YYYY-MM-DD). */
  blockedDate: string;
  /** HH:MM:SS or null for whole-day. */
  startTime: string | null;
  endTime: string | null;
  /** VEVENT SUMMARY truncated, or null if absent. */
  reason: string | null;
};

export type FetchAndParseResult =
  | { ok: true; events: ParsedEvent[] }
  | { ok: false; error: string };

function isoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoTime(d: Date): string {
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * True if the VEVENT is a whole-day (DTSTART;VALUE=DATE) entry. node-ical
 * surfaces this as `datetype === 'date'` (no time component).
 */
function isAllDay(event: Record<string, unknown>): boolean {
  return event.datetype === "date";
}

function truncateReason(s: string | undefined | null): string | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed.length > 200 ? trimmed.slice(0, 197) + "…" : trimmed;
}

/**
 * Fetch the URL with a strict timeout + identifying UA. Returns the raw
 * iCal text on success. Used by parseFeed and by the subscribe action's
 * validation step.
 */
export async function fetchIcalText(
  feedUrl: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(feedUrl);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "webcal:") {
    return { ok: false, error: "Calendar links must start with https://, http://, or webcal://." };
  }
  // webcal:// is just iCal-over-HTTP by convention — rewrite for fetch.
  const httpUrl = parsedUrl.protocol === "webcal:"
    ? feedUrl.replace(/^webcal:/, "https:")
    : feedUrl;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(httpUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/calendar, text/plain;q=0.9, */*;q=0.5" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `Calendar server returned ${res.status}.` };
    }
    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR")) {
      return { ok: false, error: "That URL didn't return a calendar feed." };
    }
    return { ok: true, text };
  } catch (e) {
    const msg = (e as Error).name === "AbortError"
      ? "Calendar server didn't respond in time."
      : `Couldn't reach the calendar (${(e as Error).message}).`;
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch + parse + expand recurrences into a flat ParsedEvent list within
 * the forward window. The polling worker uses this; the subscribe action
 * uses the looser validateFeed() below for its first-sync dry-run.
 */
export async function fetchAndParseFeed(
  feedUrl: string,
): Promise<FetchAndParseResult> {
  const fetched = await fetchIcalText(feedUrl);
  if (!fetched.ok) return { ok: false, error: fetched.error };
  return { ok: true, events: await parseIcalText(fetched.text) };
}

export async function parseIcalText(text: string): Promise<ParsedEvent[]> {
  // Dynamic import — keeps node-ical's heavy transitive deps out of the
  // build-time module graph. See file header comment.
  const ical = await import("node-ical");
  const parsed = ical.parseICS(text);
  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setUTCMonth(windowEnd.getUTCMonth() + FORWARD_WINDOW_MONTHS);
  const out: ParsedEvent[] = [];

  for (const key of Object.keys(parsed)) {
    const ev = parsed[key] as unknown as Record<string, unknown>;
    if (!ev || ev.type !== "VEVENT") continue;
    const uid = (ev.uid as string) || null;
    if (!uid) continue;

    const summary = truncateReason(ev.summary as string | undefined);
    const dtStart = ev.start as Date | undefined;
    const dtEnd = ev.end as Date | undefined;
    if (!dtStart) continue;

    const rrule = ev.rrule as { between?: (start: Date, end: Date, inclusive?: boolean) => Date[] } | undefined;

    if (rrule && typeof rrule.between === "function") {
      // Recurring — expand within window. node-ical hands us an rrule.js
      // instance whose .between(start, end, inclusive) returns Date[].
      const occurrences = rrule.between(now, windowEnd, true);
      const duration = dtEnd && dtStart ? dtEnd.getTime() - dtStart.getTime() : 0;
      for (const occ of occurrences) {
        const occEnd = duration > 0 ? new Date(occ.getTime() + duration) : occ;
        out.push(shapeEvent(uid, occ, occEnd, summary, isAllDay(ev)));
      }
      continue;
    }

    // Non-recurring — single occurrence (skip if before window).
    if (dtStart > windowEnd) continue;
    if (dtEnd && dtEnd < now) continue;
    if (!dtEnd && dtStart < new Date(now.getTime() - 24 * 3600 * 1000)) continue;
    out.push(shapeEvent(uid, dtStart, dtEnd ?? dtStart, summary, isAllDay(ev)));
  }
  return out;
}

function shapeEvent(
  uid: string,
  start: Date,
  end: Date,
  summary: string | null,
  allDay: boolean,
): ParsedEvent {
  const blockedDate = isoDate(start);
  if (allDay) {
    return { uid, blockedDate, startTime: null, endTime: null, reason: summary };
  }
  // For partial-day blocks the (start, end) must be same calendar date for
  // the schema. Cross-midnight events get clipped to the start day's
  // whole-day block (rare for venue/vendor calendars — better than splitting
  // into two ical rows which would confuse re-sync dedup).
  if (isoDate(start) !== isoDate(end)) {
    return { uid, blockedDate, startTime: null, endTime: null, reason: summary };
  }
  return {
    uid,
    blockedDate,
    startTime: isoTime(start),
    endTime: isoTime(end),
    reason: summary,
  };
}
