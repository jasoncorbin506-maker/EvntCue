import type { DateStatus } from "@/lib/events/timing";
import s from "./DateStatusBadge.module.css";

/**
 * Small visual badge for the event's date_status. Per F5.b in
 * decisions-log/2026-05-23-event-start-time-architecture.md.
 *
 *   tentative → muted grey (the default state — date is a placeholder)
 *   confirmed → rose accent outline (first vendor accepted; calendar locks)
 *   final     → solid rose (locked, ~14 days out, day-of mode incoming)
 *
 * Pure presentation — no interaction. Status transitions happen via
 * EventDateEditor (full date+time edit cascade) or LockDateCta (tentative
 * → confirmed quick flip).
 *
 * Locale-aware label via the LABELS table; ES copy uses the project's
 * DFW register conventions. (i18n keys move to messages/*.json under
 * dashboard.dateStatus.* in B-3's polish pass.)
 */

const LABELS: Record<DateStatus, { en: string; es: string }> = {
  tentative: { en: "Tentative", es: "Tentativa" },
  confirmed: { en: "Confirmed", es: "Confirmada" },
  final: { en: "Final", es: "Final" },
};

export type DateStatusBadgeProps = {
  status: DateStatus;
  locale?: "en" | "es";
  className?: string;
};

export function DateStatusBadge({
  status,
  locale = "en",
  className,
}: DateStatusBadgeProps) {
  const meta = LABELS[status];
  const label = locale === "es" ? meta.es : meta.en;
  return (
    <span className={`${s.badge} ${s[status]} ${className ?? ""}`}>{label}</span>
  );
}
