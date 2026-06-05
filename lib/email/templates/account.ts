import "server-only";

/**
 * Account-moderation emails. The suspension email is the user-facing surface, so
 * it follows the sacred rules: GENERIC ("community standards" — never the
 * internal reason code), dignified, and not a dead-end (the appeal link is the
 * path back). EN + ES per the platform bilingual standard.
 */

export type EmailLocale = "en" | "es";
export type EmailContent = { subject: string; text: string; html: string };

const BTN =
  "display:inline-block;padding:11px 18px;border-radius:9px;background:#E8622A;color:#fff;text-decoration:none;font-weight:600";
const WRAP =
  "font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#111";

export function renderSuspensionEmail(args: {
  appealUrl: string;
  locale: EmailLocale;
}): EmailContent {
  const es = args.locale === "es";

  const subject = es
    ? "Tu cuenta de EvntCue ha sido suspendida"
    : "Your EvntCue account has been suspended";
  const lead = es
    ? "Hemos suspendido tu cuenta por actividad que va en contra de nuestras normas de la comunidad. Mientras esté suspendida, no podrás usar tu portal."
    : "We’ve suspended your account for activity that goes against our community standards. While it’s suspended, you won’t be able to use your portal.";
  const appeal = es
    ? "Si crees que fue un error, una persona real lo revisará. Inicia sesión para apelar:"
    : "If you think this was a mistake, a real person will review it. Sign in to appeal:";
  const cta = es ? "Apelar la suspensión" : "Appeal the suspension";

  const text = `${lead}\n\n${appeal}\n${args.appealUrl}`;
  const html = `<div style="${WRAP}"><p>${lead}</p><p>${appeal}</p><p><a href="${args.appealUrl}" style="${BTN}">${cta}</a></p></div>`;
  return { subject, text, html };
}

export function renderAppealReceivedEmail(args: {
  tenantLabel: string;
}): EmailContent {
  // Internal alert to admins — plain + functional, English only.
  const subject = `New account appeal — ${args.tenantLabel}`;
  const text = `A suspended account submitted an appeal: ${args.tenantLabel}. Review it in the admin board.`;
  const html = `<div style="${WRAP}"><p>A suspended account submitted an appeal: <b>${args.tenantLabel}</b>.</p><p>Review it in the admin board.</p></div>`;
  return { subject, text, html };
}
