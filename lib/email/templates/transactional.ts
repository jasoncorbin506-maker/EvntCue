import {
  EMAIL_ACCENTS,
  button,
  emailShell,
  eyebrow,
  headline,
  paragraph,
  subtle,
  type EmailAccentKey,
} from "./_layout.ts";

/**
 * Phase 1 transactional email templates — account-lifecycle core.
 *
 *   - Welcome (5 portal variants)        → sent from postAuthSeed on first signup
 *   - Password-reset request             → sent from requestRecoveryAction
 *   - Password-changed confirmation      → sent from setPasswordAction
 *
 * Pattern matches event-notifications.ts: pure string builders that reuse the
 * editorial-stationery shell in ./_layout.ts. EN + DFW Spanish per Lock 9 via
 * inline locale branching (NOT messages/*.json keys — emails don't use the
 * app i18n catalog). Each render fn returns { subject, text, html }; plain text
 * is mandatory (deliverability + screen readers).
 *
 * Intentionally NOT `server-only` — no secrets, no DB, no Resend. The server
 * boundary stays on lib/email/send.ts and the call sites that touch Supabase.
 *
 * Brand-vocab discipline (sacred rule): Vndr / Vndrs / Venu / Plnr / Catr /
 * Orgnz are canonical labels and stay English even in ES copy. The Cue ✦ glyph
 * is reserved for Cue-context surfaces, not standard transactional mail, so
 * "Cue" appears as a plain word here.
 *
 * Design note: all five welcome variants use the Cormorant headline() helper —
 * first contact is a warm moment and the shell is editorial by design. Rather
 * than fork a Barlow-headline variant per portal, the warmth is carried by the
 * headline and the portal identity by the eyebrow + accent + body. (Minimal
 * forking; flagged to Cowork.)
 */

export type EmailLocale = "en" | "es";

export type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

/** Welcome variants map 1:1 to the seeded portal roles. */
export type WelcomePortal = "orgnz" | "vndr" | "venu" | "plnr" | "catr";

function joinText(lines: ReadonlyArray<string | null>): string {
  return lines.filter((l): l is string => l !== null).join("\n");
}

// =============================================================================
// Welcome — sent on first account creation (postAuthSeed, gated on !existingUser)
// =============================================================================

type WelcomeCopy = {
  accent: EmailAccentKey;
  subject: string;
  eyebrow: string;
  headline: string;
  body: string;
  /** Optional second line. */
  body2: string | null;
  cta: string;
  preheader: string;
  footerNote: string;
};

const WELCOME_COPY: Record<WelcomePortal, Record<EmailLocale, WelcomeCopy>> = {
  orgnz: {
    en: {
      accent: "orgnz",
      subject: "Your event is real now",
      eyebrow: "You're in",
      headline: "Your event is real now.",
      body: "Welcome to EvntCue. Cue is already at work on your plan — your dashboard has your budget, your timeline, and the next steps waiting.",
      body2: null,
      cta: "Open your dashboard",
      preheader: "Your plan is ready inside EvntCue.",
      footerNote: "You're receiving this because you just created an event on EvntCue.",
    },
    es: {
      accent: "orgnz",
      subject: "Tu evento ya es real",
      eyebrow: "Ya estás dentro",
      headline: "Tu evento ya es real.",
      body: "Bienvenido a EvntCue. Cue ya está trabajando en tu plan — tu panel tiene tu presupuesto, tu cronograma y los próximos pasos listos.",
      body2: null,
      cta: "Abrir tu panel",
      preheader: "Tu plan está listo dentro de EvntCue.",
      footerNote: "Recibes esto porque acabas de crear un evento en EvntCue.",
    },
  },
  vndr: {
    en: {
      accent: "vndr",
      subject: "Welcome to EvntCue",
      eyebrow: "Welcome to EvntCue",
      headline: "Your profile is live.",
      body: "Inquiries land here as Cue matches you to events that fit. Finish your profile so the right ones find you.",
      body2: null,
      cta: "Finish your profile",
      preheader: "Your Vndr profile is live on EvntCue.",
      footerNote: "You're receiving this because you just created a Vndr profile on EvntCue.",
    },
    es: {
      accent: "vndr",
      subject: "Bienvenido a EvntCue",
      eyebrow: "Bienvenido a EvntCue",
      headline: "Tu perfil está activo.",
      body: "Las solicitudes llegan aquí a medida que Cue te conecta con eventos afines. Completa tu perfil para que los indicados te encuentren.",
      body2: null,
      cta: "Completar tu perfil",
      preheader: "Tu perfil Vndr está activo en EvntCue.",
      footerNote: "Recibes esto porque acabas de crear un perfil Vndr en EvntCue.",
    },
  },
  venu: {
    en: {
      accent: "venu",
      subject: "Welcome to EvntCue",
      eyebrow: "Welcome to EvntCue",
      headline: "Your venue is on EvntCue.",
      body: "Organizers discover spaces here as Cue matches them to events. Your dashboard is where inquiries and dates come together.",
      body2: null,
      cta: "Go to your dashboard",
      preheader: "Your Venu account is ready on EvntCue.",
      footerNote: "You're receiving this because you just created a Venu account on EvntCue.",
    },
    es: {
      accent: "venu",
      subject: "Bienvenido a EvntCue",
      eyebrow: "Bienvenido a EvntCue",
      headline: "Tu venue está en EvntCue.",
      body: "Los organizadores descubren espacios aquí a medida que Cue los conecta con eventos. Tu panel es donde las solicitudes y las fechas se reúnen.",
      body2: null,
      cta: "Ir a tu panel",
      preheader: "Tu cuenta Venu está lista en EvntCue.",
      footerNote: "Recibes esto porque acabas de crear una cuenta Venu en EvntCue.",
    },
  },
  plnr: {
    en: {
      accent: "plnr",
      subject: "Welcome to EvntCue",
      eyebrow: "Welcome to EvntCue",
      headline: "Welcome to your workspace.",
      body: "EvntCue keeps your events, the Vndrs you work with, and your timelines in one place. Your dashboard is ready when you are.",
      body2: null,
      cta: "Go to your dashboard",
      preheader: "Your Plnr workspace is ready on EvntCue.",
      footerNote: "You're receiving this because you just created a Plnr account on EvntCue.",
    },
    es: {
      accent: "plnr",
      subject: "Bienvenido a EvntCue",
      eyebrow: "Bienvenido a EvntCue",
      headline: "Bienvenido a tu espacio.",
      body: "EvntCue mantiene tus eventos, los Vndrs con quienes trabajas y tus cronogramas en un solo lugar. Tu panel está listo cuando tú lo estés.",
      body2: null,
      cta: "Ir a tu panel",
      preheader: "Tu espacio Plnr está listo en EvntCue.",
      footerNote: "Recibes esto porque acabas de crear una cuenta Plnr en EvntCue.",
    },
  },
  catr: {
    en: {
      accent: "catr",
      subject: "Welcome to EvntCue",
      eyebrow: "Welcome to EvntCue",
      headline: "Your profile is live.",
      body: "Inquiries land here as Cue matches you to events and menus that fit. Finish your profile so the right tables find you.",
      body2: null,
      cta: "Go to your dashboard",
      preheader: "Your Catr account is ready on EvntCue.",
      footerNote: "You're receiving this because you just created a Catr account on EvntCue.",
    },
    es: {
      accent: "catr",
      subject: "Bienvenido a EvntCue",
      eyebrow: "Bienvenido a EvntCue",
      headline: "Tu perfil está activo.",
      body: "Las solicitudes llegan aquí a medida que Cue te conecta con eventos y menús afines. Completa tu perfil para que las mesas indicadas te encuentren.",
      body2: null,
      cta: "Ir a tu panel",
      preheader: "Tu cuenta Catr está lista en EvntCue.",
      footerNote: "Recibes esto porque acabas de crear una cuenta Catr en EvntCue.",
    },
  },
};

export function renderWelcomeEmail(args: {
  portal: WelcomePortal;
  ctaUrl: string;
  locale: EmailLocale;
}): EmailContent {
  const c = WELCOME_COPY[args.portal][args.locale];
  const accent = EMAIL_ACCENTS[c.accent];

  const text = joinText([
    c.headline,
    "",
    c.body,
    c.body2 ? "" : null,
    c.body2,
    "",
    `${c.cta}: ${args.ctaUrl}`,
    "",
    "— EvntCue",
  ]);

  const html = emailShell({
    lang: args.locale,
    preheader: c.preheader,
    footerNote: c.footerNote,
    children: joinText([
      eyebrow(c.eyebrow, accent),
      headline(c.headline),
      paragraph(c.body),
      c.body2 ? paragraph(c.body2) : null,
      button({ href: args.ctaUrl, label: c.cta, accent }),
    ]),
  });

  return { subject: c.subject, text, html };
}

// =============================================================================
// Password-reset request — sent from requestRecoveryAction via generateLink
// =============================================================================

const RESET_ACCENT = EMAIL_ACCENTS.neutral;

export function renderPasswordResetRequestEmail(args: {
  actionUrl: string;
  locale: EmailLocale;
}): EmailContent {
  if (args.locale === "es") {
    const text = joinText([
      "Vamos a que vuelvas a entrar.",
      "",
      "Alguien pidió restablecer la contraseña de esta cuenta de EvntCue. Abre el enlace de abajo para elegir una nueva — es válido por una hora.",
      "",
      `Elegir una nueva contraseña: ${args.actionUrl}`,
      "",
      "Si no solicitaste esto, puedes ignorar este correo — tu contraseña no cambiará.",
      "",
      "— EvntCue",
    ]);
    const html = emailShell({
      lang: "es",
      preheader: "Restablece tu contraseña — el enlace vence en una hora.",
      footerNote:
        "Recibes esto porque se solicitó un restablecimiento de contraseña para tu cuenta de EvntCue.",
      children: joinText([
        eyebrow("Restablecer contraseña", RESET_ACCENT),
        headline("Vamos a que vuelvas a entrar."),
        paragraph(
          "Alguien pidió restablecer la contraseña de esta cuenta de EvntCue. Elige una nueva — el enlace es válido por <b style=\"color:#1F2533;\">una hora</b>.",
        ),
        button({ href: args.actionUrl, label: "Elegir una nueva contraseña", accent: RESET_ACCENT }),
        subtle("Si no solicitaste esto, puedes ignorar este correo — tu contraseña no cambiará."),
      ]),
    });
    return { subject: "Restablece tu contraseña de EvntCue", text, html };
  }

  const text = joinText([
    "Let's get you back in.",
    "",
    "Someone asked to reset the password for this EvntCue account. Open the link below to choose a new one — it's good for one hour.",
    "",
    `Choose a new password: ${args.actionUrl}`,
    "",
    "If you didn't request this, you can safely ignore this email — your password won't change.",
    "",
    "— EvntCue",
  ]);
  const html = emailShell({
    lang: "en",
    preheader: "Reset your password — the link expires in an hour.",
    footerNote:
      "You're receiving this because a password reset was requested for your EvntCue account.",
    children: joinText([
      eyebrow("Password reset", RESET_ACCENT),
      headline("Let's get you back in."),
      paragraph(
        "Someone asked to reset the password for this EvntCue account. Choose a new one — the link is good for <b style=\"color:#1F2533;\">one hour</b>.",
      ),
      button({ href: args.actionUrl, label: "Choose a new password", accent: RESET_ACCENT }),
      subtle("If you didn't request this, you can safely ignore this email — your password won't change."),
    ]),
  });
  return { subject: "Reset your EvntCue password", text, html };
}

// =============================================================================
// Password-changed confirmation — sent from setPasswordAction after updateUser
// =============================================================================

export function renderPasswordChangedEmail(args: {
  signInUrl: string;
  locale: EmailLocale;
}): EmailContent {
  if (args.locale === "es") {
    const text = joinText([
      "Tu contraseña fue cambiada.",
      "",
      "Esto confirma que la contraseña de tu cuenta de EvntCue se acaba de actualizar.",
      "",
      `Iniciar sesión: ${args.signInUrl}`,
      "",
      "Si fuiste tú, todo está en orden. Si no, restablece tu contraseña de inmediato y contáctanos.",
      "",
      "— EvntCue",
    ]);
    const html = emailShell({
      lang: "es",
      preheader: "La contraseña de tu cuenta de EvntCue se acaba de cambiar.",
      footerNote: "Recibes esto porque tu contraseña de EvntCue se acaba de cambiar.",
      children: joinText([
        eyebrow("Seguridad", RESET_ACCENT),
        headline("Tu contraseña fue cambiada."),
        paragraph("Esto confirma que la contraseña de tu cuenta de EvntCue se acaba de actualizar."),
        button({ href: args.signInUrl, label: "Iniciar sesión", accent: RESET_ACCENT }),
        subtle(
          "Si fuiste tú, todo está en orden. Si no, restablece tu contraseña de inmediato y contáctanos.",
        ),
      ]),
    });
    return { subject: "Tu contraseña de EvntCue cambió", text, html };
  }

  const text = joinText([
    "Your password was changed.",
    "",
    "This confirms that the password for your EvntCue account was just updated.",
    "",
    `Sign in: ${args.signInUrl}`,
    "",
    "If this was you, you're all set. If it wasn't, reset your password right away and contact us.",
    "",
    "— EvntCue",
  ]);
  const html = emailShell({
    lang: "en",
    preheader: "The password for your EvntCue account was just changed.",
    footerNote: "You're receiving this because your EvntCue password was just changed.",
    children: joinText([
      eyebrow("Security", RESET_ACCENT),
      headline("Your password was changed."),
      paragraph("This confirms that the password for your EvntCue account was just updated."),
      button({ href: args.signInUrl, label: "Sign in", accent: RESET_ACCENT }),
      subtle("If this was you, you're all set. If it wasn't, reset your password right away and contact us."),
    ]),
  });
  return { subject: "Your EvntCue password was changed", text, html };
}
