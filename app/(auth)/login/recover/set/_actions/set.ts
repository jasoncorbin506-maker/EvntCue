"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/i18n/locale";

export type SetPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * PARKING_LOT #55 — final step of recovery. Caller must already be in a
 * recovery session (established by /auth/recover route handler). Updates
 * the user's password and redirects into the platform.
 */
export async function setPasswordAction(formData: FormData): Promise<SetPasswordResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords didn't match. Try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Your recovery link expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  // Security confirmation email. Fire-and-forget — a send failure must not
  // block the password change or the redirect (Lock 22).
  if (user.email) {
    await sendPasswordChangedEmail(user.email);
  }

  redirect("/orgnz");
}

/** Never throws — the password change has already committed by this point. */
async function sendPasswordChangedEmail(email: string): Promise<void> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto =
      h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const signInUrl = `${proto}://${host}/login`;

    const locale = await getLocale();
    const { renderPasswordChangedEmail } = await import(
      "@/lib/email/templates/transactional"
    );
    const { sendEmail } = await import("@/lib/email/send");
    const content = renderPasswordChangedEmail({ signInUrl, locale });
    await sendEmail({
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      tags: [{ name: "kind", value: "password-changed" }],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`password-changed email threw: ${message}`);
  }
}
