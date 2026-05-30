import {
  EMAIL_ACCENTS,
  button,
  emailShell,
  eyebrow,
  headline,
  linePair,
  paragraph,
  subtle,
} from "./_layout.ts";
import type { BuyerRole, EmailContent, EmailLocale } from "./booking-lifecycle.ts";

/**
 * Phase 3 / Workstream 2 — cross-party delivery-failure email (buyer-side).
 *
 * When a transactional email TO A SELLER bounces (today: the `inquiry-received`
 * send; `booking-confirmed` seller-side later), the buyer who's waiting on that
 * seller would otherwise be left guessing why the seller looks unresponsive.
 * The Resend webhook fires this email to the buyer so the silence is explained
 * with a next step — open the inquiry and try a direct contact.
 *
 * Buyer-role accent (Lock 26): orgnz buyer → rose; venue-as-buyer → bay blue.
 * EN + DFW Spanish per Lock 9 via inline locale branching. The Cue ✦ glyph is
 * permitted here (the soft-vs-hard reassurance line is a Cue-context moment,
 * Lock 18). Pure string builder over the editorial-stationery shell — no DB, no
 * secrets — so it snapshot-tests and previews like the other template modules.
 *
 * Activation gate (Lock 27): the WEBHOOK enforces this before calling here (it
 * skips + audit-logs a non-active event), so this renderer assumes an active
 * event and stays presentation-only.
 */

/** What the bounced send was, for the "we tried to deliver your ___" clause. */
export type FailedSendKind = "inquiry" | "booking-confirmation" | "decline";

/** Hard = permanent reject; soft = transient, Resend keeps retrying. */
export type BounceKind = "hard" | "soft";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function joinText(lines: ReadonlyArray<string | null>): string {
  return lines.filter((l): l is string => l !== null).join("\n");
}

/** The noun for the thing we couldn't deliver, locale-aware. */
function failedNoun(kind: FailedSendKind, es: boolean): string {
  if (es) {
    return kind === "inquiry"
      ? "consulta"
      : kind === "booking-confirmation"
        ? "confirmación de reserva"
        : "aviso de rechazo";
  }
  return kind === "inquiry"
    ? "inquiry"
    : kind === "booking-confirmation"
      ? "booking confirmation"
      : "decline notice";
}

/** Humanized failure label for the detail panel. */
function failureLabel(bounce: BounceKind, es: boolean): string {
  if (bounce === "hard") {
    return es ? "Permanente (rebote duro)" : "Permanent (hard bounce)";
  }
  return es ? "Temporal (reintentando)" : "Temporary (retrying)";
}

export function renderDeliveryFailureCrossPartyEmail(args: {
  buyerRole: BuyerRole;
  sellerName: string;
  eventName: string;
  /** What bounced (drives the "we tried to deliver your ___" clause). */
  failedKind: FailedSendKind;
  bounceKind: BounceKind;
  /** Caller-formatted send timestamp (e.g. "May 30, 2026 · 2:14 PM"). */
  sentAt: string;
  /** Buyer-side inquiry detail route. */
  ctaUrl: string;
  locale: EmailLocale;
}): EmailContent {
  const es = args.locale === "es";
  const accent = args.buyerRole === "venue" ? EMAIL_ACCENTS.venu : EMAIL_ACCENTS.orgnz;
  const noun = failedNoun(args.failedKind, es);
  const failure = failureLabel(args.bounceKind, es);

  const subject = es
    ? `No pudimos contactar a ${args.sellerName} para ${args.eventName}`
    : `We couldn't reach ${args.sellerName} for ${args.eventName}`;

  const introText = es
    ? `Intentamos entregar tu ${noun} para ${args.eventName}, pero la dirección de correo de ${args.sellerName} rechazó el mensaje. Su bandeja podría estar llena, la dirección pudo cambiar, o puede haber un problema en su servidor.`
    : `We tried to deliver your ${noun} for ${args.eventName}, but ${args.sellerName}'s email address rejected the message. Their inbox may be full, the address may have changed, or there may be a server issue on their side.`;
  const introHtml = es
    ? `Intentamos entregar tu ${noun} para <b style="color:#1F2533;">${esc(args.eventName)}</b>, pero la dirección de correo de <b style="color:#1F2533;">${esc(args.sellerName)}</b> rechazó el mensaje. Su bandeja podría estar llena, la dirección pudo cambiar, o puede haber un problema en su servidor.`
    : `We tried to deliver your ${noun} for <b style="color:#1F2533;">${esc(args.eventName)}</b>, but <b style="color:#1F2533;">${esc(args.sellerName)}</b>'s email address rejected the message. Their inbox may be full, the address may have changed, or there may be a server issue on their side.`;

  const cueLine = es
    ? "Cue ✦ seguirá intentando con los rebotes temporales. Para rebotes permanentes, quizá quieras contactar a " + args.sellerName + " directamente."
    : "Cue ✦ will keep trying for soft bounces. For hard bounces, you may want to reach " + args.sellerName + " directly.";
  const cueHtml = es
    ? `Cue ✦ seguirá intentando con los rebotes temporales. Para rebotes permanentes, quizá quieras contactar a <b style="color:#1F2533;">${esc(args.sellerName)}</b> directamente.`
    : `Cue ✦ will keep trying for soft bounces. For hard bounces, you may want to reach <b style="color:#1F2533;">${esc(args.sellerName)}</b> directly.`;

  const pairs = [
    { label: es ? "Vendedor" : "Seller", value: esc(args.sellerName) },
    { label: es ? "Evento" : "Event", value: esc(args.eventName) },
    { label: es ? "Enviado" : "Sent", value: esc(args.sentAt) },
    { label: es ? "Fallo" : "Failure", value: esc(failure) },
  ];

  const microcopy = es
    ? "Abre la consulta para intentar un contacto directo."
    : "Open the inquiry to try a direct contact.";

  const text = joinText([
    es
      ? `No pudimos entregar el correo a ${args.sellerName}.`
      : `Email couldn't reach ${args.sellerName}.`,
    "",
    introText,
    "",
    `${es ? "Vendedor" : "Seller"}: ${args.sellerName}`,
    `${es ? "Evento" : "Event"}: ${args.eventName}`,
    `${es ? "Enviado" : "Sent"}: ${args.sentAt}`,
    `${es ? "Fallo" : "Failure"}: ${failure}`,
    "",
    cueLine,
    "",
    microcopy,
    `${es ? "Abrir consulta" : "Open inquiry"}: ${args.ctaUrl}`,
    "",
    "— EvntCue",
  ]);

  const html = emailShell({
    lang: args.locale,
    preheader: es
      ? "Su correo rebotó. Esto es lo que puedes intentar."
      : "Their email bounced. Here's what to try next.",
    footerNote: es
      ? "Recibes esto porque un correo a un vendedor de tu evento de EvntCue no se pudo entregar."
      : "You're receiving this because an email to a seller on your EvntCue event couldn't be delivered.",
    children: joinText([
      eyebrow(es ? "Problema de entrega" : "Delivery issue", accent),
      headline(
        es
          ? `No pudimos contactar a ${esc(args.sellerName)}.`
          : `Email couldn't reach ${esc(args.sellerName)}.`,
      ),
      paragraph(introHtml),
      linePair(pairs),
      paragraph(cueHtml),
      subtle(microcopy),
      button({ href: args.ctaUrl, label: es ? "Abrir consulta" : "Open inquiry", accent }),
    ]),
  });

  return { subject, text, html };
}
