"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postAuthSeed } from "@/lib/auth/post-auth-seed";

async function buildCallbackUrl(intent: string | null, role: string | null): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const cb = new URL("/auth/callback", `${proto}://${host}`);
  if (intent) cb.searchParams.set("intent", intent);
  if (role) cb.searchParams.set("role", role);
  return cb.toString();
}

export type AuthResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; needsConfirm?: true };

const validateEmail = (email: string): string | null => {
  const v = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v;
};

export async function signUpAction(formData: FormData): Promise<AuthResult> {
  const email = validateEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const intent = (formData.get("intent") as string | null) || null;
  const role = (formData.get("role") as string | null) || null;

  if (!email) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const emailRedirectTo = await buildCallbackUrl(intent, role);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });

  if (error) return { ok: false, error: error.message };

  // With email confirmation enabled, the session is null and Supabase emails
  // the user a confirmation link → /auth/callback. The cookies (capture
  // session + calc state) stay on this device, so when the user clicks the
  // link in the same browser, postAuthSeed runs there and seeds the event.
  if (!data.session || !data.user) {
    return {
      ok: false,
      error: `We sent a confirmation link to ${email}. Click it to finish setting up your event.`,
      needsConfirm: true,
    };
  }

  const redirectTo = await postAuthSeed({
    userId: data.user.id,
    email: data.user.email ?? email,
    intent,
    role,
  });

  return { ok: true, redirectTo };
}

export async function signInAction(formData: FormData): Promise<AuthResult> {
  const email = validateEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const intent = (formData.get("intent") as string | null) || null;
  const role = (formData.get("role") as string | null) || null;

  if (!email) return { ok: false, error: "Enter a valid email." };
  if (!password) return { ok: false, error: "Enter your password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { ok: false, error: "Email or password didn't match. Try again." };
  }

  const redirectTo = await postAuthSeed({
    userId: data.user.id,
    email: data.user.email ?? email,
    intent,
    role,
  });

  return { ok: true, redirectTo };
}

/**
 * Wrapper that calls one of the actions and redirects on success. Used as the
 * <form action> target so that on success we navigate via Next's redirect()
 * (throws inside server actions) rather than returning JSON to the client.
 */
export async function submitAuth(formData: FormData): Promise<AuthResult> {
  const mode = String(formData.get("mode") ?? "signin");
  const result = mode === "signup" ? await signUpAction(formData) : await signInAction(formData);
  if (result.ok) redirect(result.redirectTo);
  return result;
}
