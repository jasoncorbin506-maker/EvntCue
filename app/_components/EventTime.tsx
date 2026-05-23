"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

/**
 * EventTime — shared timestamp renderer.
 *
 * Per F4.b in decisions-log/2026-05-23-event-start-time-architecture.md:
 *   - Default to viewer's browser timezone for most surfaces (planners,
 *     vendors, organizers viewing remotely all see times in their own TZ).
 *   - Operational surfaces (run-of-show, BEO, day-of mode) pass mode="event"
 *     to render in the event's timezone — those are for people physically
 *     at the event.
 *   - Hover/touch reveals the other view as a tooltip so out-of-town users
 *     can sanity-check against event-local time and on-site users can see
 *     viewer-local if they're remotely coordinating with someone.
 *
 * Use this component everywhere an event timestamp is rendered. Replacing
 * raw `new Date(at).toLocaleString()` calls across the app is task B-2.
 *
 * Locale-aware via next-intl's useLocale() — uses the active locale's
 * Intl.DateTimeFormat rules for display.
 */

export type EventTimeMode = "viewer" | "event";
export type EventTimeFormat = "short" | "long" | "dateOnly" | "timeOnly";

export type EventTimeProps = {
  /** ISO TIMESTAMPTZ string (preferred), or Date object. */
  at: string | Date | null;
  /** Event's IANA timezone (e.g., "America/Chicago"). Required even when
   *  mode="viewer" so the tooltip can render the event-local view. */
  eventTimezone: string;
  /** "viewer" (default) renders in browser TZ; "event" renders in event TZ. */
  mode?: EventTimeMode;
  /** "short" (default): "May 23, 2026, 5:00 PM"
   *  "long": "Saturday, May 23, 2026 at 5:00 PM CDT"
   *  "dateOnly": "May 23, 2026"
   *  "timeOnly": "5:00 PM" */
  format?: EventTimeFormat;
  /** Toggle the title-attribute tooltip. Default true. */
  showTooltip?: boolean;
  /** Optional className passthrough for styling. */
  className?: string;
  /** Fallback text if `at` is null (e.g., "All day"). */
  fallback?: string;
};

export function EventTime({
  at,
  eventTimezone,
  mode = "viewer",
  format = "short",
  showTooltip = true,
  className,
  fallback = "—",
}: EventTimeProps) {
  const locale = useLocale();
  const intlLocale = locale === "es" ? "es-MX" : "en-US";

  const date = useMemo(() => {
    if (at == null) return null;
    if (at instanceof Date) return at;
    const d = new Date(at);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [at]);

  const { primary, tooltip } = useMemo(() => {
    if (!date) {
      return { primary: fallback, tooltip: undefined };
    }
    const viewerStr = formatInTz(date, undefined, format, intlLocale);
    const eventStr = formatInTz(date, eventTimezone, format, intlLocale);
    if (mode === "viewer") {
      return {
        primary: viewerStr,
        tooltip:
          viewerStr === eventStr
            ? undefined
            : locale === "es"
              ? `Hora del evento: ${eventStr}`
              : `Event time: ${eventStr}`,
      };
    }
    return {
      primary: eventStr,
      tooltip:
        viewerStr === eventStr
          ? undefined
          : locale === "es"
            ? `Tu hora: ${viewerStr}`
            : `Your time: ${viewerStr}`,
    };
  }, [date, eventTimezone, mode, format, intlLocale, fallback, locale]);

  if (!showTooltip || !tooltip) {
    return <span className={className}>{primary}</span>;
  }
  return (
    <span className={className} title={tooltip}>
      {primary}
    </span>
  );
}

function formatInTz(
  date: Date,
  tz: string | undefined,
  format: EventTimeFormat,
  intlLocale: string,
): string {
  const opts: Intl.DateTimeFormatOptions = (() => {
    switch (format) {
      case "long":
        return {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZoneName: "short",
        };
      case "dateOnly":
        return {
          year: "numeric",
          month: "short",
          day: "numeric",
        };
      case "timeOnly":
        return {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        };
      case "short":
      default:
        return {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        };
    }
  })();
  if (tz) opts.timeZone = tz;
  return new Intl.DateTimeFormat(intlLocale, opts).format(date);
}
