"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { postAuthSeed } from "@/lib/auth/post-auth-seed";
import { getLocale } from "@/i18n/locale";

async function buildCallbackUrl(
  intent: string | null,
  role: string | null,
  next: string | null,
): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const cb = new URL("/auth/callback", `${proto}://${host}`);
  if (intent) cb.searchParams.set("intent", intent);
  if (role) cb.searchParams.set("role", role);
  if (next) cb.searchParams.set("next", next);
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

// PARKING_LOT #58 — same-origin path guard for `next`. proxy.ts only
// writes app paths, but a hand-crafted /login?next=//evil.com would
// otherwise escape on submit. Mirror the guard in login/page.tsx.
const safeNext = (n: string | null): string | null => {
  if (!n) return null;
  if (!n.startsWith("/")) return null;
  if (n.startsWith("//")) return null;
  return n;
};

export async function signUpAction(formData: FormData): Promise<AuthResult> {
  const email = validateEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const intent = (formData.get("intent") as string | null) || null;
  const role = (formData.get("role") as string | null) || null;
  const next = safeNext((formData.get("next") as string | null) ?? null);

  if (!email) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  // PARKING_LOT #12 + #15 fix (session 15): persist email + calc state to the
  // LCS row BEFORE auth.signUp. Two reasons:
  //   1. If the user abandons after signup (never confirms), the row still has
  //      email_captured + pending_calc_state for future re-engagement.
  //   2. If the user confirms on a different device, /auth/callback's fallback
  //      path looks up the LCS row by email + converted_user_id IS NULL and
  //      seeds the event from pending_calc_state. See migration 027.
  const c = await cookies();
  const sessionToken = c.get("evntcue_capture_session")?.value;
  const stateRaw = c.get("evntcue_calc_state")?.value;
  if (sessionToken) {
    let pendingCalcState: unknown = null;
    if (stateRaw) {
      try {
        pendingCalcState = JSON.parse(stateRaw);
      } catch {
        // malformed cookie — leave column NULL
      }
    }
    const admin = createAdminClient();
    await admin
      .from("landing_capture_sessions")
      .update({
        email_captured: email,
        ...(pendingCalcState !== null && { pending_calc_state: pendingCalcState }),
      })
      .eq("session_token", sessionToken);
  }

  // Create the account + generate a branded verification link. Mirrors
  // requestRecoveryAction (PR #16): admin.generateLink does NOT send an email —
  // it returns a hashed_token we deliver ourselves via Resend, so the only
  // verify email the user gets is the EvntCue-branded one. (GoTrue's built-in
  // Confirm-signup template is disabled in the dashboard; with generateLink it
  // wouldn't fire anyway.) postAuthSeed runs at /auth/callback after the user
  // verifies — not here — since signup always requires confirmation now.
  const admin = createAdminClient();
  const callbackUrl = await buildCallbackUrl(intent, role, next);
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo: callbackUrl },
  });

  // Account-enumeration guard (preserve Phase 1 posture): generateLink errors
  // for an already-registered email. Swallow it and return the same
  // "check your inbox" response so the form never discloses whether an account
  // exists. Same pattern as requestRecoveryAction.
  const hashedToken = data?.properties?.hashed_token;
  const confirmMsg = `We sent a verification link to ${email}. Click it to finish setting up your account.`;
  if (error || !hashedToken) {
    return { ok: false, error: confirmMsg, needsConfirm: true };
  }

  // Build our own action URL straight to /auth/callback with the token_hash +
  // portal context. intent/role/next ride the URL (buildCallbackUrl set them),
  // so context survives the signup→verify round-trip, including cross-device.
  // The callback verifies via verifyOtp({ type: 'signup' }).
  const actionUrl = new URL(callbackUrl);
  actionUrl.searchParams.set("token_hash", hashedToken);
  actionUrl.searchParams.set("type", "signup");

  // Fire-and-forget (Lock 22 — inform, never block): a send failure must not
  // break account creation. The auth row already exists; the user can recover
  // via a fresh signup if the email never lands. Resend is lazy-imported in the
  // helper (heavy-dep rule).
  const locale = await getLocale();
  await sendVerifyEmail(email, actionUrl.toString(), locale);

  return { ok: false, error: confirmMsg, needsConfirm: true };
}

/**
 * Send the EvntCue-branded verification email. Never throws — a failed send
 * must not break signup (Lock 22). Resend + the template module are
 * lazy-imported so they stay out of the auth bundle's eager graph (heavy-dep
 * rule). Mirrors sendWelcomeEmail in post-auth-seed.ts.
 */
async function sendVerifyEmail(
  email: string,
  actionUrl: string,
  locale: "en" | "es",
): Promise<void> {
  try {
    const { renderVerifyEmail } = await import("@/lib/email/templates/transactional");
    const { sendEmail } = await import("@/lib/email/send");
    const content = renderVerifyEmail({ actionUrl, email, locale });
    const result = await sendEmail({
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      tags: [{ name: "kind", value: "verify-email" }],
    });
    if (!result.ok) {
      console.warn(`verify email failed for signup: ${result.error}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`verify email threw for signup: ${message}`);
  }
}

export async function signInAction(formData: FormData): Promise<AuthResult> {
  const email = validateEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const intent = (formData.get("intent") as string | null) || null;
  const role = (formData.get("role") as string | null) || null;
  const next = safeNext((formData.get("next") as string | null) ?? null);

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

  const seedRedirect = await postAuthSeed({
    userId: data.user.id,
    email: data.user.email ?? email,
    intent,
    role,
  });

  return { ok: true, redirectTo: next ?? seedRedirect };
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
