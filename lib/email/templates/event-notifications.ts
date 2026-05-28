import type {
  DateChangePayload,
} from "@/lib/events/event-notifications-shared";
import {
  EMAIL_ACCENTS,
  button,
  dateChangePanel,
  emailShell,
  eyebrow,
  headline,
  paragraph,
  quote,
  subtle,
} from "./_layout";

/**
 * Email templates for Lock 24 event_notifications (Chunk E).
 *
 * Two template families — initial notification (sent on cascade write
 * path INSERT) + day-7 reminder (sent by the cron route). EN + ES per
 * Lock 14b. Voice constraints per Lock 24 hard constraint #5:
 *
 *   "Email templates respect Cue voice. Cormorant italic for warm
 *    moments; 'we wanted to let you know' framing not 'URGENT: DATE
 *    CHANGED'."
 *
 * Presentation lives in ./_layout.ts (the shared editorial-stationery shell
 * reused by the Phase 1 transactional templates). This module owns copy +
 * locale + the notification-specific date panel only.
 *
 * Output: { subject, text, html } per template. Plain text is mandatory
 * (deliverability + screen readers); HTML is the rich editorial variant.
 *
 * Brand-vocab discipline: Vndr / Plnr / Venu / Orgnz stay English even in ES
 * copy. Descriptive prose uses Spanish category nouns where natural.
 *
 * Audience is Vndr + Catr → coral accent (Lock 18). Not server-only: pure
 * string builders; the Resend/DB boundary stays in lib/email/send.ts +
 * lib/events/notifications.ts.
 */

export type DateChangeEmailLocale = "en" | "es";

export type DateChangeEmailContent = {
  subject: string;
  text: string;
  html: string;
};

const ACCENT = EMAIL_ACCENTS.vndr;

/** Escape user-supplied text (event name, Orgnz reason) before HTML interpolation. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateLong(iso: string | null, locale: DateChangeEmailLocale): string {
  if (!iso) return "TBD";
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string | null, locale: DateChangeEmailLocale): string | null {
  if (!iso) return null;
  const [h, m] = iso.split(":").map((p) => parseInt(p, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(locale === "es" ? "es-US" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function withTime(dateLabel: string, time: string | null): string {
  return time ? `${dateLabel} · ${time}` : dateLabel;
}

// =============================================================================
// Initial notification — sent on cascade commit (Chunk B write path)
// =============================================================================

export function renderInitialNotificationEmail(args: {
  eventName: string;
  payload: DateChangePayload;
  detailUrl: string;
  locale: DateChangeEmailLocale;
}): DateChangeEmailContent {
  const { eventName, payload, detailUrl, locale } = args;
  const was = withTime(formatDateLong(payload.oldStartDate, locale), formatTime(payload.oldStartTime, locale));
  const now = withTime(formatDateLong(payload.newStartDate, locale), formatTime(payload.newStartTime, locale));
  const reason = payload.reason ?? null;
  const safeName = esc(eventName);

  if (locale === "es") {
    const subject = `Cambio de fecha — ${eventName}`;
    const text = [
      `Queríamos avisarte:`,
      ``,
      `La Orgnz movió la fecha de ${eventName}.`,
      ``,
      `Antes: ${was}`,
      `Ahora: ${now}`,
      reason ? `` : null,
      reason ? `Nota de la Orgnz: "${reason}"` : null,
      ``,
      `Revisa el cambio y responde (aceptar o declinar) cuando puedas — tienes 14 días.`,
      ``,
      `${detailUrl}`,
      ``,
      `— EvntCue`,
    ]
      .filter((l): l is string => l !== null)
      .join("\n");
    const html = emailShell({
      lang: "es",
      preheader: `La fecha de ${eventName} cambió — revisa y responde en 14 días.`,
      footerNote: `Recibes esto porque tienes una reserva activa en EvntCue.`,
      children: [
        eyebrow("Cambio de fecha", ACCENT),
        headline("Queríamos avisarte."),
        paragraph(`La Orgnz movió la fecha de <b style="color:#1F2533;">${safeName}</b>.`),
        dateChangePanel({ wasLabel: "Antes", nowLabel: "Ahora", was, now, accent: ACCENT }),
        reason ? quote(esc(reason), ACCENT, "Nota de la Orgnz") : "",
        subtle(`Revisa el cambio y responde cuando puedas — tienes <b style="color:#5A5346;">14 días</b>.`),
        button({ href: detailUrl, label: "Revisar el cambio", accent: ACCENT }),
      ].join("\n"),
    });
    return { subject, text, html };
  }

  // EN
  const subject = `Date change — ${eventName}`;
  const text = [
    `We wanted to let you know:`,
    ``,
    `The Orgnz moved the date of ${eventName}.`,
    ``,
    `Was: ${was}`,
    `Now: ${now}`,
    reason ? `` : null,
    reason ? `Note from the Orgnz: "${reason}"` : null,
    ``,
    `Review the change and respond when you can — you have 14 days.`,
    ``,
    `${detailUrl}`,
    ``,
    `— EvntCue`,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
  const html = emailShell({
    lang: "en",
    preheader: `The date for ${eventName} moved — review and respond within 14 days.`,
    footerNote: `You're receiving this because you have an active booking on EvntCue.`,
    children: [
      eyebrow("Date change", ACCENT),
      headline("We wanted to let you know."),
      paragraph(`The Orgnz moved the date of <b style="color:#1F2533;">${safeName}</b>.`),
      dateChangePanel({ wasLabel: "Was", nowLabel: "Now", was, now, accent: ACCENT }),
      reason ? quote(esc(reason), ACCENT, "Note from the Orgnz") : "",
      subtle(`Review the change and respond when you can — you have <b style="color:#5A5346;">14 days</b>.`),
      button({ href: detailUrl, label: "Review the change", accent: ACCENT }),
    ].join("\n"),
  });
  return { subject, text, html };
}

// =============================================================================
// Day-7 reminder — sent by hourly cron route on pending+>=7d rows
// =============================================================================

export function renderReminderEmail(args: {
  eventName: string;
  payload: DateChangePayload;
  detailUrl: string;
  locale: DateChangeEmailLocale;
}): DateChangeEmailContent {
  const { eventName, payload, detailUrl, locale } = args;
  const newDate = formatDateLong(payload.newStartDate, locale);
  const safeName = esc(eventName);
  const newDateAccent = `<span style="color:${ACCENT};font-weight:600;">${esc(newDate)}</span>`;

  if (locale === "es") {
    const subject = `Recordatorio — cambio de fecha de ${eventName}`;
    const text = [
      `Solo te recordamos:`,
      ``,
      `La fecha de ${eventName} cambió a ${newDate}.`,
      ``,
      `Aún no has respondido — tienes 7 días más antes de que la solicitud expire.`,
      `Si la fecha no funciona, declinar es una opción válida; la Orgnz lo verá y podrá buscar otra solución.`,
      ``,
      `${detailUrl}`,
      ``,
      `— EvntCue`,
    ].join("\n");
    const html = emailShell({
      lang: "es",
      preheader: `Quedan 7 días para responder al cambio de fecha de ${eventName}.`,
      footerNote: `Recibes esto porque tienes una reserva activa en EvntCue.`,
      children: [
        eyebrow("Recordatorio", ACCENT),
        headline("Solo te recordamos."),
        paragraph(`La fecha de <b style="color:#1F2533;">${safeName}</b> cambió a ${newDateAccent}.`),
        paragraph(`Aún no has respondido — tienes <b style="color:#1F2533;">7 días</b> más antes de que la solicitud expire. Si la fecha no funciona, declinar es una opción válida; la Orgnz lo verá y podrá buscar otra solución.`),
        button({ href: detailUrl, label: "Revisar el cambio", accent: ACCENT }),
      ].join("\n"),
    });
    return { subject, text, html };
  }

  // EN
  const subject = `Reminder — date change for ${eventName}`;
  const text = [
    `Just a quick reminder:`,
    ``,
    `The date of ${eventName} moved to ${newDate}.`,
    ``,
    `You haven't responded yet — you have 7 more days before the request expires.`,
    `If the new date doesn't work, declining is a valid choice; the Orgnz will see it and can find another path forward.`,
    ``,
    `${detailUrl}`,
    ``,
    `— EvntCue`,
  ].join("\n");
  const html = emailShell({
    lang: "en",
    preheader: `7 days left to respond to the date change for ${eventName}.`,
    footerNote: `You're receiving this because you have an active booking on EvntCue.`,
    children: [
      eyebrow("Reminder", ACCENT),
      headline("Just a quick reminder."),
      paragraph(`The date of <b style="color:#1F2533;">${safeName}</b> moved to ${newDateAccent}.`),
      paragraph(`You haven't responded yet — you have <b style="color:#1F2533;">7 more days</b> before the request expires. If the new date doesn't work, declining is a valid choice; the Orgnz will see it and can find another path forward.`),
      button({ href: detailUrl, label: "Review the change", accent: ACCENT }),
    ].join("\n"),
  });
  return { subject, text, html };
}
