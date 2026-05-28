/**
 * PL #61 — pure helpers for the Orgnz multi-event picker.
 *
 * Deliberately free of server imports (no `next/headers`, no Supabase) so the
 * selection + ordering logic is unit-testable in isolation. `load-context.ts`
 * composes these with the DB read; the Chrome picker renders the result.
 */

/** Picker display order: soonest upcoming first, then most-recent past, then
 *  undated last. `start_date` is a `YYYY-MM-DD` string, so lexical compare ==
 *  chronological compare. `today` is injectable for deterministic tests. */
export function compareEventsForPicker(
  a: { start_date: string | null },
  b: { start_date: string | null },
  today: string = new Date().toISOString().slice(0, 10),
): number {
  const ad = a.start_date ?? null;
  const bd = b.start_date ?? null;
  if (!ad && !bd) return 0;
  if (!ad) return 1;
  if (!bd) return -1;
  const aUpcoming = ad >= today;
  const bUpcoming = bd >= today;
  if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
  // Both upcoming → soonest first (asc). Both past → most recent first (desc).
  if (aUpcoming) return ad < bd ? -1 : ad > bd ? 1 : 0;
  return ad > bd ? -1 : ad < bd ? 1 : 0;
}

/** Stable picker ordering. Returns a new array; never mutates the input. */
export function sortEventsForPicker<T extends { start_date: string | null }>(
  events: readonly T[],
  today?: string,
): T[] {
  return [...events].sort((a, b) => compareEventsForPicker(a, b, today));
}

/**
 * Resolve which event is the active selection.
 *
 * Callers pass the tenant's events already ordered most-recent-first, so the
 * default (no/invalid `?event=`) is index 0 — preserving the pre-#61 behavior.
 * A valid `requestedId` overrides it. An id that isn't in the list (stale
 * bookmark / foreign tenant — the tenant filter is the security boundary)
 * falls back to the default and flags `eventNotFound` so the UI can warn
 * softly (Lock 22: warnings inform, never block).
 */
export function resolveSelectedEvent<T extends { id: string }>(
  eventsByRecency: readonly T[],
  requestedId: string | null,
): { selected: T | null; eventNotFound: boolean } {
  const fallback = eventsByRecency[0] ?? null;
  if (!requestedId) return { selected: fallback, eventNotFound: false };
  const match = eventsByRecency.find((e) => e.id === requestedId) ?? null;
  if (match) return { selected: match, eventNotFound: false };
  return { selected: fallback, eventNotFound: true };
}

/** Humanize an `event_type` slug for display ("corporate_gala" → "Corporate
 *  Gala"). The type vocabulary is open-ended, so we format rather than maintain
 *  an i18n key per type. */
export function humanizeEventType(eventType: string): string {
  return eventType
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
