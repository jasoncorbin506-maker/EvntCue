"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type RecoverResult =
  | { ok: true }
  | { ok: false; error: string };

const validateEmail = (email: string): string | null => {
  const v = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v;
};

async function buildRecoverRedirect(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return new URL("/auth/recover", `${proto}://${host}`).toString();
}

/**
 * PARKING_LOT #55 — kicks off the password recovery flow.
 *
 * Sends a Supabase recovery email. The email's link points at
 * /auth/recover (route handler) which exchanges the code and sends the
 * user to /login/recover/set to choose a new password.
 *
 * Always returns { ok: true } on a valid email shape — we don't disclose
 * whether the email is registered (account-enumeration guard).
 */
export async function requestRecoveryAction(formData: FormData): Promise<RecoverResult> {
  const email = validateEmail(String(formData.get("email") ?? ""));
  if (!email) return { ok: false, error: "Enter a valid email." };

  const supabase = await createClient();
  const redirectTo = await buildRecoverRedirect();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  return { ok: true };
}
