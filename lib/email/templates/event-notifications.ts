import "server-only";

import type {
  DateChangePayload,
} from "@/lib/events/event-notifications-shared";

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
 * Output: { subject, text, html } per template. The Resend wrapper
 * accepts all three. Plain text is mandatory (deliverability + screen
 * readers); HTML is the rich variant with light Cormorant-italic
 * styling on warm phrases.
 *
 * Brand-vocab discipline: Vndr / Plnr / Venu / Orgnz stay English even
 * in ES copy (Cue languageInjection prompt already canonicalizes this).
 * Descriptive prose uses Spanish category nouns where natural.
 */

export type DateChangeEmailLocale = "en" | "es";

export type DateChangeEmailContent = {
  subject: string;
  text: string;
  html: string;
};

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

const SHELL_OPEN = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#0e1014;font-family:Georgia,'Cormorant Garamond',serif;color:#E5E5E5;">
<div style="max-width:560px;margin:0 auto;background:#15181f;border:1px solid #2a2d33;border-radius:12px;padding:28px;">`;
const SHELL_CLOSE = `</div></body></html>`;

const BUTTON_STYLE = `display:inline-block;padding:12px 22px;background:#E8622A;color:#fff;text-decoration:none;border-radius:999px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;font-size:14px;letter-spacing:0.02em;`;

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
  const oldDate = formatDateLong(payload.oldStartDate, locale);
  const newDate = formatDateLong(payload.newStartDate, locale);
  const oldTime = formatTime(payload.oldStartTime, locale);
  const newTime = formatTime(payload.newStartTime, locale);
  const reasonBlock = payload.reason ? payload.reason : null;

  if (locale === "es") {
    const subject = `Cambio de fecha — ${eventName}`;
    const text = [
      `Queríamos avisarte:`,
      ``,
      `La Orgnz movió la fecha de ${eventName}.`,
      ``,
      `Antes: ${oldDate}${oldTime ? ` · ${oldTime}` : ""}`,
      `Ahora:  ${newDate}${newTime ? ` · ${newTime}` : ""}`,
      reasonBlock ? `` : ``,
      reasonBlock ? `Nota de la Orgnz: "${reasonBlock}"` : ``,
      ``,
      `Revisa el cambio y responde (aceptar o declinar) cuando puedas — tienes 14 días.`,
      ``,
      `${detailUrl}`,
      ``,
      `— EvntCue`,
    ]
      .filter((l) => l !== null)
      .join("\n");
    const html = `${SHELL_OPEN}
<p style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#E5E5E5;margin:0 0 16px;">Queríamos avisarte:</p>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#C8C8C8;margin:0 0 16px;">
La Orgnz movió la fecha de <b style="color:#E5E5E5;">${eventName}</b>.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:13px;">
<tr><td style="padding:4px 10px 4px 0;color:#8C8C8C;">Antes</td><td style="color:#C8C8C8;">${oldDate}${oldTime ? ` · ${oldTime}` : ""}</td></tr>
<tr><td style="padding:4px 10px 4px 0;color:#8C8C8C;">Ahora</td><td style="color:#E8622A;font-weight:600;">${newDate}${newTime ? ` · ${newTime}` : ""}</td></tr>
</table>
${reasonBlock ? `<p style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C8C8C8;border-left:2px solid #E8622A;padding:4px 12px;margin:0 0 16px;">"${reasonBlock}"</p>` : ""}
<p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#C8C8C8;margin:0 0 20px;">
Revisa el cambio y responde cuando puedas — tienes 14 días.
</p>
<a href="${detailUrl}" style="${BUTTON_STYLE}">Revisar el cambio →</a>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#5C5C5C;margin:24px 0 0;">— EvntCue</p>
${SHELL_CLOSE}`;
    return { subject, text, html };
  }

  // EN
  const subject = `Date change — ${eventName}`;
  const text = [
    `We wanted to let you know:`,
    ``,
    `The Orgnz moved the date of ${eventName}.`,
    ``,
    `Was:  ${oldDate}${oldTime ? ` · ${oldTime}` : ""}`,
    `Now:  ${newDate}${newTime ? ` · ${newTime}` : ""}`,
    reasonBlock ? `` : ``,
    reasonBlock ? `Note from the Orgnz: "${reasonBlock}"` : ``,
    ``,
    `Review the change and respond when you can — you have 14 days.`,
    ``,
    `${detailUrl}`,
    ``,
    `— EvntCue`,
  ]
    .filter((l) => l !== null)
    .join("\n");
  const html = `${SHELL_OPEN}
<p style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#E5E5E5;margin:0 0 16px;">We wanted to let you know:</p>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#C8C8C8;margin:0 0 16px;">
The Orgnz moved the date of <b style="color:#E5E5E5;">${eventName}</b>.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:13px;">
<tr><td style="padding:4px 10px 4px 0;color:#8C8C8C;">Was</td><td style="color:#C8C8C8;">${oldDate}${oldTime ? ` · ${oldTime}` : ""}</td></tr>
<tr><td style="padding:4px 10px 4px 0;color:#8C8C8C;">Now</td><td style="color:#E8622A;font-weight:600;">${newDate}${newTime ? ` · ${newTime}` : ""}</td></tr>
</table>
${reasonBlock ? `<p style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C8C8C8;border-left:2px solid #E8622A;padding:4px 12px;margin:0 0 16px;">"${reasonBlock}"</p>` : ""}
<p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#C8C8C8;margin:0 0 20px;">
Review the change and respond when you can — you have 14 days.
</p>
<a href="${detailUrl}" style="${BUTTON_STYLE}">Review the change →</a>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#5C5C5C;margin:24px 0 0;">— EvntCue</p>
${SHELL_CLOSE}`;
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
    const html = `${SHELL_OPEN}
<p style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#E5E5E5;margin:0 0 16px;">Solo te recordamos:</p>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#C8C8C8;margin:0 0 16px;">
La fecha de <b style="color:#E5E5E5;">${eventName}</b> cambió a <span style="color:#E8622A;font-weight:600;">${newDate}</span>.
</p>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#C8C8C8;margin:0 0 16px;">
Aún no has respondido — tienes 7 días más antes de que la solicitud expire. Si la fecha no funciona, declinar es una opción válida; la Orgnz lo verá y podrá buscar otra solución.
</p>
<a href="${detailUrl}" style="${BUTTON_STYLE}">Revisar el cambio →</a>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#5C5C5C;margin:24px 0 0;">— EvntCue</p>
${SHELL_CLOSE}`;
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
  const html = `${SHELL_OPEN}
<p style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#E5E5E5;margin:0 0 16px;">Just a quick reminder:</p>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#C8C8C8;margin:0 0 16px;">
The date of <b style="color:#E5E5E5;">${eventName}</b> moved to <span style="color:#E8622A;font-weight:600;">${newDate}</span>.
</p>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#C8C8C8;margin:0 0 16px;">
You haven't responded yet — you have 7 more days before the request expires. If the new date doesn't work, declining is a valid choice; the Orgnz will see it and can find another path forward.
</p>
<a href="${detailUrl}" style="${BUTTON_STYLE}">Review the change →</a>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#5C5C5C;margin:24px 0 0;">— EvntCue</p>
${SHELL_CLOSE}`;
  return { subject, text, html };
}
