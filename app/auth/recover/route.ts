import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PARKING_LOT #55 — recovery-email landing.
 *
 * Supabase emails the recovery link of the form:
 *   <SITE_URL>/auth/recover?code=<otp>
 *
 * We exchange the code for a session (PKCE flow), then send the user to the
 * new-password form at /login/recover/set. The set page is auth-gated, so
 * if the exchange fails we route back to /login/recover with an error.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorDesc = url.searchParams.get("error_description");

  if (errorDesc) {
    const back = new URL("/login/recover", url);
    back.searchParams.set("error", errorDesc);
    return NextResponse.redirect(back);
  }

  if (!code) {
    const back = new URL("/login/recover", url);
    back.searchParams.set("error", "missing_code");
    return NextResponse.redirect(back);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const back = new URL("/login/recover", url);
    back.searchParams.set("error", "expired_link");
    return NextResponse.redirect(back);
  }

  return NextResponse.redirect(new URL("/login/recover/set", url));
}
