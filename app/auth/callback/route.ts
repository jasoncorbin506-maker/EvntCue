import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postAuthSeed } from "@/lib/auth/post-auth-seed";

/**
 * Email-confirm landing. Supabase emails users a link of the form:
 *   <SITE_URL>/auth/callback?code=<otp>&intent=...&role=...
 *
 * We exchange the code for a session, then run postAuthSeed (mirrors the
 * direct-signin flow) so the funnel cookies — if the user is on the same
 * browser they signed up from — get consumed into a real events row +
 * event_budgets line items.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const intent = url.searchParams.get("intent");
  const role = url.searchParams.get("role");
  const errorDesc = url.searchParams.get("error_description");

  if (errorDesc) {
    const back = new URL("/login", url);
    back.searchParams.set("error", errorDesc);
    return NextResponse.redirect(back);
  }

  if (!code) {
    const back = new URL("/login", url);
    back.searchParams.set("error", "missing_code");
    return NextResponse.redirect(back);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const back = new URL("/login", url);
    back.searchParams.set("error", "confirm_failed");
    return NextResponse.redirect(back);
  }

  const target = await postAuthSeed({
    userId: data.user.id,
    email: data.user.email ?? "",
    intent,
    role,
  });

  return NextResponse.redirect(new URL(target, url));
}
