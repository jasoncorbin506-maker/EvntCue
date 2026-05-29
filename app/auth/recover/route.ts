import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * PARKING_LOT #55 — recovery-email landing. Two link shapes are accepted:
 *
 *   1. /auth/recover?token_hash=<hash>&type=recovery
 *      Our branded Resend email (requestRecoveryAction → admin.generateLink).
 *      Verified with verifyOtp — an admin-generated link has no client PKCE
 *      verifier, so exchangeCodeForSession can't be used for it.
 *
 *   2. /auth/recover?code=<otp>
 *      Legacy / any Supabase-direct recovery link (PKCE). Still handled so
 *      in-flight or fallback links don't dead-end.
 *
 * On success we send the user to the new-password form at /login/recover/set
 * (auth-gated). On failure we route back to /login/recover with an error.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const errorDesc = url.searchParams.get("error_description");

  const fail = (reason: string) => {
    const back = new URL("/login/recover", url);
    back.searchParams.set("error", reason);
    return NextResponse.redirect(back);
  };

  if (errorDesc) return fail(errorDesc);

  const supabase = await createClient();

  if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type as EmailOtpType | null) ?? "recovery",
    });
    if (error || !data.user) return fail("expired_link");
    return NextResponse.redirect(new URL("/login/recover/set", url));
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) return fail("expired_link");
    return NextResponse.redirect(new URL("/login/recover/set", url));
  }

  return fail("missing_code");
}
