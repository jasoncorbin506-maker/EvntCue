"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocale } from "@/i18n/locale";

export type RecoverResult =
  | { ok: true }
  | { ok: false; error: string };

const validateEmail = (email: string): string | null => {
  const v = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v;
};

async function buildBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * PARKING_LOT #55 — kicks off the password recovery flow.
 *
 * Generates a recovery token via the admin API (which does NOT send an email),
 * then delivers our branded reset template via Resend. The link points at
 * /auth/recover with a token_hash, which that route verifies via verifyOtp
 * (the documented custom-email pattern — an admin-generated link has no client
 * PKCE verifier, so we can't use the old exchangeCodeForSession path here).
 *
 * Always returns { ok: true } on a valid email shape — we don't disclose
 * whether the email is registered (account-enumeration guard). generateLink
 * errors for a missing account; we swallow that and still return ok.
 */
export async function requestRecoveryAction(formData: FormData): Promise<RecoverResult> {
  const email = validateEmail(String(formData.get("email") ?? ""));
  if (!email) return { ok: false, error: "Enter a valid email." };

  const baseUrl = await buildBaseUrl();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${baseUrl}/auth/recover` },
  });

  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) {
    // Account doesn't exist (or token gen failed) — stay silent per the
    // enumeration guard. Nothing sent; the user sees the same "check your inbox".
    return { ok: true };
  }

  const actionUrl = `${baseUrl}/auth/recover?token_hash=${encodeURIComponent(
    hashedToken,
  )}&type=recovery`;

  const locale = await getLocale();
  const { renderPasswordResetRequestEmail } = await import(
    "@/lib/email/templates/transactional"
  );
  const { sendEmail } = await import("@/lib/email/send");
  const content = renderPasswordResetRequestEmail({ actionUrl, locale });
  await sendEmail({
    to: email,
    subject: content.subject,
    text: content.text,
    html: content.html,
    tags: [{ name: "kind", value: "password-reset" }],
  });

  return { ok: true };
}
