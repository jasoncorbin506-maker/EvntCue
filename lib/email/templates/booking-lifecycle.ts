import {
  EMAIL_ACCENTS,
  button,
  emailShell,
  eyebrow,
  headline,
  linePair,
  paragraph,
  quoteBlock,
  subtle,
} from "./_layout.ts";

/**
 * Phase 2 transactional email templates — the booking lifecycle.
 *
 *   - inquiry-received   → a buyer sends an inquiry; the seller is notified
 *   - booking-confirmed  → a booking is confirmed; buyer + seller each notified
 *   - decline            → a seller declines; the buyer is notified
 *
 * Pure string builders over the editorial-stationery shell in ./_layout.ts,
 * same as the Phase 1 module (transactional.ts). EN + DFW Spanish per Lock 9 via
 * inline locale branching. Each render fn returns { subject, text, html }.
 *
 * NOT wired to triggers in this PR (Phase 2a = renderers only). The inquiry-
 * creation and accept→bookings surfaces do not exist in app code yet (inquiries
 * are seeder-only today; nothing INSERTs `bookings`), so trigger wiring +
 * activation-gate-at-call-site + send-audit logging are deferred to Phase 2b
 * when those primitives land. See outbox-cc 2026-05-29 Phase 0a findings.
 *
 * Brand-vocab discipline (sacred rule): Vndr / Venu / Plnr / Catr / Orgnz are
 * canonical labels; no "client" / "customer" / "service provider" / "supplier".
 * Real-name policy (Jason 2026-05-29): buyer + seller real tenant names surface
 * in subject + body — no anonymization layer. The Cue ✦ glyph is permitted in
 * the decline template's Cue-context line (Lock 18), not elsewhere.
 *
 * Buyer-context (Lock 26): when the buyer is a venue (buyer_role = 'venue'), the
 * buyer-name treatment carries a thin venu-accent underline so the seller reads
 * "a venue is buying" at a glance, and decline emails to a venue-buyer use the
 * venu accent. Venue-buyer booking-confirmed is deferred to Phase 2.5.
 */

export type EmailLocale = "en" | "es";

export type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

/** Seller-side portals — the four roles that receive inquiries / bookings. */
export type SellerPortal = "vndr" | "venu" | "plnr" | "catr";

/** Buyer roles per Lock 26. Venue-as-buyer renders with the venu accent. */
export type BuyerRole = "orgnz" | "venue";

/**
 * Long user-supplied blocks (inquiry message, decline reason) are truncated to
 * the first paragraph break or this many characters, whichever comes first, so
 * the email stays scannable. Threshold chosen at implementation; cited in PR.
 */
const MESSAGE_MAX = 500;

function joinText(lines: ReadonlyArray<string | null>): string {
  return lines.filter((l): l is string => l !== null).join("\n");
}

/** Escape user-supplied text before HTML interpolation (Lock 24 pattern). */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Truncate a free-text block to the first paragraph break or MESSAGE_MAX. */
function truncate(raw: string): string {
  const trimmed = raw.trim();
  const para = trimmed.indexOf("\n\n");
  const cut = Math.min(para === -1 ? Infinity : para, MESSAGE_MAX);
  if (cut >= trimmed.length) return trimmed;
  return trimmed.slice(0, cut).trimEnd() + "…";
}

/** Buyer name for HTML — venue-buyers get a thin venu-accent underline. */
function buyerNameHtml(name: string, role: BuyerRole): string {
  const safe = esc(name);
  if (role === "venue") {
    return `<span style="border-bottom:2px solid ${EMAIL_ACCENTS.venu};padding-bottom:1px;">${safe}</span>`;
  }
  return safe;
}

// =============================================================================
// inquiry-received — seller-side (4 portal variants: accent + CTA differ)
// =============================================================================

export function renderInquiryReceivedEmail(args: {
  sellerPortal: SellerPortal;
  buyerName: string;
  buyerRole: BuyerRole;
  eventName: string;
  eventDate: string; // caller-formatted (e.g. "Saturday, May 1, 2027 · 4:30 PM")
  city?: string; // omit when there's no honest source (events carry no location yet)
  budget?: string; // caller-formatted (e.g. "$8,000–$12,000"); omit if undisclosed
  message: string; // raw inquiry body
  ctaUrl: string;
  locale: EmailLocale;
}): EmailContent {
  const es = args.locale === "es";
  const accent = EMAIL_ACCENTS[args.sellerPortal];
  const nameHtml = buyerNameHtml(args.buyerName, args.buyerRole);
  const msg = truncate(args.message);
  const city = args.city?.trim() || null;

  const pairs: { label: string; value: string }[] = [
    { label: es ? "Evento" : "Event", value: esc(args.eventName) },
    { label: es ? "Fecha" : "Date", value: esc(args.eventDate) },
  ];
  if (city) {
    pairs.push({ label: es ? "Dónde" : "Where", value: esc(city) });
  }
  if (args.budget) {
    pairs.push({ label: es ? "Presupuesto" : "Budget", value: esc(args.budget) });
  }

  const subject = es
    ? `Nueva consulta de ${args.buyerName} — ${args.eventName}`
    : `New inquiry from ${args.buyerName} — ${args.eventName}`;

  const window = es
    ? "Revisa y responde dentro de 7 días."
    : "Review and respond within 7 days.";

  // The "planning X on DATE [in CITY]" sentence drops the location clause when
  // city is absent (events carry no location field yet).
  const introText = es
    ? `Está planeando ${args.eventName} el ${args.eventDate}${city ? ` en ${city}` : ""}. Esto fue lo que compartió:`
    : `They're planning ${args.eventName} on ${args.eventDate}${city ? ` in ${city}` : ""}. Here's what they shared:`;
  const introHtml = es
    ? `Está planeando <b style="color:#1F2533;">${esc(args.eventName)}</b> el ${esc(args.eventDate)}${city ? ` en ${esc(city)}` : ""}. Esto fue lo que compartió:`
    : `They're planning <b style="color:#1F2533;">${esc(args.eventName)}</b> on ${esc(args.eventDate)}${city ? ` in ${esc(city)}` : ""}. Here's what they shared:`;

  const text = joinText([
    es
      ? `${args.buyerName} quiere trabajar contigo.`
      : `${args.buyerName} would like to work with you.`,
    "",
    introText,
    "",
    `“${msg}”`,
    "",
    `${es ? "Evento" : "Event"}: ${args.eventName}`,
    `${es ? "Fecha" : "Date"}: ${args.eventDate}`,
    city ? `${es ? "Dónde" : "Where"}: ${city}` : null,
    args.budget ? `${es ? "Presupuesto" : "Budget"}: ${args.budget}` : null,
    "",
    window,
    `${es ? "Abrir consulta" : "Open inquiry"}: ${args.ctaUrl}`,
    "",
    "— EvntCue",
  ]);

  const html = emailShell({
    lang: args.locale,
    preheader: es
      ? `${args.buyerName} pregunta por el ${args.eventDate}. Revisa y responde dentro de 7 días.`
      : `${args.buyerName} is asking about ${args.eventDate}. Review and respond within 7 days.`,
    footerNote: es
      ? "Recibes esto porque alguien envió una consulta a tu cuenta de EvntCue."
      : "You're receiving this because someone sent an inquiry to your EvntCue account.",
    children: joinText([
      eyebrow(es ? "Nueva consulta" : "New inquiry", accent),
      headline(
        es ? `${nameHtml} quiere trabajar contigo.` : `${nameHtml} would like to work with you.`,
      ),
      paragraph(introHtml),
      quoteBlock(esc(msg)),
      linePair(pairs),
      subtle(window),
      button({ href: args.ctaUrl, label: es ? "Abrir consulta" : "Open inquiry", accent }),
    ]),
  });

  return { subject, text, html };
}

// =============================================================================
// booking-confirmed — 2 independent sends per booking (buyer + seller)
//   buyer side: orgnz only this phase (venue-buyer → Phase 2.5)
//   seller side: 4 portal variants
// =============================================================================

export function renderBookingConfirmedEmail(args: {
  recipient: "buyer" | "seller";
  sellerPortal: SellerPortal; // seller accent + CTA; also the seller name shown to the buyer
  buyerName: string;
  sellerName: string;
  eventName: string;
  eventDate: string; // caller-formatted
  city: string;
  total: string; // caller-formatted (e.g. "$9,500")
  nextMilestone?: string; // buyer side only; optional
  ctaUrl: string;
  locale: EmailLocale;
}): EmailContent {
  const es = args.locale === "es";

  if (args.recipient === "buyer") {
    const accent = EMAIL_ACCENTS.orgnz;
    const pairs: { label: string; value: string }[] = [
      { label: es ? "Evento" : "Event", value: esc(args.eventName) },
      { label: es ? "Fecha" : "Date", value: esc(args.eventDate) },
      { label: es ? "Vendedor" : "Seller", value: esc(args.sellerName) },
      { label: es ? "Total acordado" : "Total agreed", value: esc(args.total) },
    ];
    if (args.nextMilestone) {
      pairs.push({ label: es ? "Siguiente" : "Next", value: esc(args.nextMilestone) });
    }

    const subject = es
      ? `Confirmado — ${args.sellerName} para ${args.eventName}`
      : `Booked — ${args.sellerName} for ${args.eventName}`;

    const text = joinText([
      es ? "Es oficial." : "It's official.",
      "",
      es
        ? `${args.sellerName} está confirmado para ${args.eventName} el ${args.eventDate}. Lo agregamos a tu evento.`
        : `${args.sellerName} is confirmed for ${args.eventName} on ${args.eventDate}. We've added them to your event.`,
      "",
      `${es ? "Evento" : "Event"}: ${args.eventName}`,
      `${es ? "Fecha" : "Date"}: ${args.eventDate}`,
      `${es ? "Vendedor" : "Seller"}: ${args.sellerName}`,
      `${es ? "Total acordado" : "Total agreed"}: ${args.total}`,
      args.nextMilestone ? `${es ? "Siguiente" : "Next"}: ${args.nextMilestone}` : null,
      "",
      es ? "Abre tu evento para ver el siguiente paso." : "Open your event to see the next step.",
      `${es ? "Abrir evento" : "Open event"}: ${args.ctaUrl}`,
      "",
      "— EvntCue",
    ]);

    const html = emailShell({
      lang: args.locale,
      preheader: es
        ? `${args.sellerName} está confirmado para ${args.eventName}.`
        : `${args.sellerName} is confirmed for ${args.eventName}.`,
      footerNote: es
        ? "Recibes esto porque se confirmó una reserva en tu evento de EvntCue."
        : "You're receiving this because a booking was confirmed on your EvntCue event.",
      children: joinText([
        eyebrow(es ? "Confirmado" : "Booked", accent),
        headline(es ? "Es oficial." : "It's official."),
        paragraph(
          es
            ? `<b style="color:#1F2533;">${esc(args.sellerName)}</b> está confirmado para ${esc(args.eventName)} el ${esc(args.eventDate)}. Lo agregamos a tu evento.`
            : `<b style="color:#1F2533;">${esc(args.sellerName)}</b> is confirmed for ${esc(args.eventName)} on ${esc(args.eventDate)}. We've added them to your event.`,
        ),
        linePair(pairs),
        subtle(
          es ? "Abre tu evento para ver el siguiente paso." : "Open your event to see the next step.",
        ),
        button({ href: args.ctaUrl, label: es ? "Abrir evento" : "Open event", accent }),
      ]),
    });

    return { subject, text, html };
  }

  // seller side
  const accent = EMAIL_ACCENTS[args.sellerPortal];
  const pairs: { label: string; value: string }[] = [
    { label: es ? "Evento" : "Event", value: esc(args.eventName) },
    { label: es ? "Fecha" : "Date", value: esc(args.eventDate) },
    { label: es ? "Dónde" : "Where", value: esc(args.city) },
    { label: es ? "Reservado por" : "Booked by", value: esc(args.buyerName) },
    { label: "Total", value: esc(args.total) },
  ];

  const subject = es
    ? `Reservado — ${args.eventName} con ${args.buyerName}`
    : `Booked — ${args.eventName} with ${args.buyerName}`;

  const text = joinText([
    es ? `Tienes una reserva para ${args.eventName}.` : `You're booked for ${args.eventName}.`,
    "",
    es
      ? `${args.buyerName} confirmó la reserva para el ${args.eventDate} en ${args.city}. Tu bandeja tiene los detalles.`
      : `${args.buyerName} confirmed the booking for ${args.eventDate} in ${args.city}. Your inbox has the details.`,
    "",
    `${es ? "Evento" : "Event"}: ${args.eventName}`,
    `${es ? "Fecha" : "Date"}: ${args.eventDate}`,
    `${es ? "Dónde" : "Where"}: ${args.city}`,
    `${es ? "Reservado por" : "Booked by"}: ${args.buyerName}`,
    `Total: ${args.total}`,
    "",
    es ? "Abre EvntCue para ver la reserva." : "Open EvntCue to see the booking.",
    `${es ? "Abrir reserva" : "Open booking"}: ${args.ctaUrl}`,
    "",
    "— EvntCue",
  ]);

  const html = emailShell({
    lang: args.locale,
    preheader: es
      ? `${args.buyerName} confirmó la reserva para el ${args.eventDate}.`
      : `${args.buyerName} confirmed the booking for ${args.eventDate}.`,
    footerNote: es
      ? "Recibes esto porque se confirmó una reserva en tu cuenta de EvntCue."
      : "You're receiving this because a booking was confirmed on your EvntCue account.",
    children: joinText([
      eyebrow(es ? "Nueva reserva" : "New booking", accent),
      headline(
        es ? `Tienes una reserva para ${esc(args.eventName)}.` : `You're booked for ${esc(args.eventName)}.`,
      ),
      paragraph(
        es
          ? `<b style="color:#1F2533;">${esc(args.buyerName)}</b> confirmó la reserva para el ${esc(args.eventDate)} en ${esc(args.city)}. Tu bandeja tiene los detalles.`
          : `<b style="color:#1F2533;">${esc(args.buyerName)}</b> confirmed the booking for ${esc(args.eventDate)} in ${esc(args.city)}. Your inbox has the details.`,
      ),
      linePair(pairs),
      subtle(es ? "Abre EvntCue para ver la reserva." : "Open EvntCue to see the booking."),
      button({ href: args.ctaUrl, label: es ? "Abrir reserva" : "Open booking", accent }),
    ]),
  });

  return { subject, text, html };
}

// =============================================================================
// decline — buyer-side (orgnz accent / venu accent for venue-buyer)
// =============================================================================

export function renderDeclineEmail(args: {
  buyerRole: BuyerRole;
  sellerName: string;
  eventName: string;
  eventDate: string; // caller-formatted
  reason?: string; // raw; falls back to a neutral line when absent
  ctaUrl: string;
  locale: EmailLocale;
}): EmailContent {
  const es = args.locale === "es";
  const accent = args.buyerRole === "venue" ? EMAIL_ACCENTS.venu : EMAIL_ACCENTS.orgnz;
  const reason = args.reason ? truncate(args.reason) : null;
  const noReason = es ? "No compartió un motivo." : "They didn't share a reason.";

  const subject = es
    ? `${args.sellerName} no puede tomar ${args.eventName}`
    : `${args.sellerName} can't take ${args.eventName}`;

  const cueLine = es
    ? "Cue ✦ te está conectando con opciones similares. Abre tu evento para ver quién más encaja."
    : "Cue ✦ is matching you with similar sellers. Open your event to see who else fits.";

  const text = joinText([
    es ? "Esta vez no." : "Not this time.",
    "",
    es
      ? `${args.sellerName} no puede tomar ${args.eventName} el ${args.eventDate}.${reason ? " Esto fue lo que compartió:" : ""}`
      : `${args.sellerName} isn't able to take ${args.eventName} on ${args.eventDate}.${reason ? " Here's why:" : ""}`,
    "",
    reason ? `“${reason}”` : noReason,
    "",
    cueLine,
    "",
    `${es ? "Abrir evento" : "Open event"}: ${args.ctaUrl}`,
    "",
    "— EvntCue",
  ]);

  const html = emailShell({
    lang: args.locale,
    preheader: es
      ? "Esto fue lo que compartió. Abre tu evento para seguir planeando."
      : "Here's what they shared. Open your event to keep planning.",
    footerNote: es
      ? "Recibes esto porque un vendedor respondió a una consulta de tu evento de EvntCue."
      : "You're receiving this because a seller responded to an inquiry on your EvntCue event.",
    children: joinText([
      eyebrow(es ? "Novedad" : "Update", accent),
      headline(es ? "Esta vez no." : "Not this time."),
      paragraph(
        es
          ? `<b style="color:#1F2533;">${esc(args.sellerName)}</b> no puede tomar ${esc(args.eventName)} el ${esc(args.eventDate)}.${reason ? " Esto fue lo que compartió:" : ""}`
          : `<b style="color:#1F2533;">${esc(args.sellerName)}</b> isn't able to take ${esc(args.eventName)} on ${esc(args.eventDate)}.${reason ? " Here's why:" : ""}`,
      ),
      reason ? quoteBlock(esc(reason)) : subtle(noReason),
      paragraph(cueLine),
      subtle(es ? "Volver a tu evento." : "Back to your event."),
      button({ href: args.ctaUrl, label: es ? "Abrir evento" : "Open event", accent }),
    ]),
  });

  return { subject, text, html };
}
