import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { postAuthSeed } from "@/lib/auth/post-auth-seed";

/**
 * Email-confirm landing. Two link shapes are accepted (mirrors /auth/recover):
 *
 *   1. /auth/callback?token_hash=<hash>&type=signup&intent=...&role=...
 *      Our branded Resend verify email (signUpAction → admin.generateLink).
 *      Verified with verifyOtp — an admin-generated link has no client PKCE
 *      verifier, so exchangeCodeForSession can't be used for it.
 *
 *   2. /auth/callback?code=<otp>&intent=...&role=...
 *      Legacy / any Supabase-direct confirmation link (PKCE). Still handled so
 *      in-flight links sent before the branded flow shipped don't dead-end.
 *
 * On success we run postAuthSeed (mirrors the direct-signin flow) so the funnel
 * cookies — if the user is on the same browser they signed up from — get
 * consumed into a real events row + event_budgets line items, and the
 * portal-appropriate welcome email fires (first account only).
 *
 * Edge cases (Lock 22 — inform, never block): an expired/invalid link routes
 * back to the signup form with a recoverable message; a link clicked when the
 * user is already verified + signed in lands them in their portal with no error.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const intent = url.searchParams.get("intent");
  const role = url.searchParams.get("role");
  const nextRaw = url.searchParams.get("next");
  // Same-origin path guard — PARKING_LOT #58. Mirrors login/page.tsx + auth.ts.
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : null;
  const errorDesc = url.searchParams.get("error_description");

  // Inform-not-block redirect helper. `mode=signup` lands the user on the
  // signup form, where re-submitting issues a fresh verification link.
  const fail = (reason: string) => {
    const back = new URL("/login", url);
    back.searchParams.set("mode", "signup");
    back.searchParams.set("error", reason);
    return NextResponse.redirect(back);
  };

  if (errorDesc) return fail(errorDesc);

  const supabase = await createClient();

  // Once we have a confirmed user, seed + route to the portal (or `next`).
  const land = async (userId: string, email: string) => {
    const seedTarget = await postAuthSeed({ userId, email, intent, role });
    return NextResponse.redirect(new URL(next ?? seedTarget, url));
  };

  // (1) Branded verify path — admin-generated link.
  if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type as EmailOtpType | null) ?? "signup",
    });
    if (!error && data.user) {
      return land(data.user.id, data.user.email ?? "");
    }
    // verifyOtp failed — but if the user is already signed in (they clicked an
    // old link after already verifying), don't show an error; just land them.
    const {
      data: { user: existing },
    } = await supabase.auth.getUser();
    if (existing) {
      return land(existing.id, existing.email ?? "");
    }
    return fail("verify_expired");
  }

  // (2) Legacy PKCE path — Supabase-direct confirmation link.
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) return fail("verify_expired");
    return land(data.user.id, data.user.email ?? "");
  }

  return fail("missing_code");
}
