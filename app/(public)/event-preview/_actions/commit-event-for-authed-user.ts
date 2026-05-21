"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  seedEventFromCalcState,
  type CalcCookieState,
} from "@/lib/auth/post-auth-seed";

/**
 * Funnel-while-already-signed-in flow.
 *
 * Background: when an authed user re-runs the calculator and lands on
 * /event-preview, the standard "Build Mood Board" CTA routes through /login,
 * which auto-redirects to /orgnz without running postAuthSeed (no auth
 * transition). The capture data sits in the LCS row + cookies and is
 * eventually GC'd by `expires_at` — silently swallowed.
 *
 * This action is the explicit "yes, add this event to my account" path:
 * read the calc cookies, seed a new events + event_budgets row on the user's
 * existing orgnz tenant, clear the cookies, route to /orgnz.
 *
 * Bypasses PARKING_LOT #56's "existing events → don't seed" guard ON
 * PURPOSE — that guard catches accidental cookie leftovers; this action is
 * an explicit user action.
 *
 * Server-only. Throws on missing session because the CTA is only rendered
 * to authed users in the first place.
 */
export async function commitEventForAuthedUserAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?intent=mood_board");
  }

  const c = await cookies();
  const sessionToken = c.get("evntcue_capture_session")?.value;
  const stateRaw = c.get("evntcue_calc_state")?.value;
  if (!sessionToken || !stateRaw) {
    // Cookies expired between page render and CTA click. No data to commit;
    // just bounce to the dashboard.
    redirect("/orgnz");
  }

  let state: CalcCookieState;
  try {
    state = JSON.parse(stateRaw) as CalcCookieState;
  } catch {
    c.delete("evntcue_capture_session");
    c.delete("evntcue_calc_state");
    redirect("/orgnz");
  }

  const admin = createAdminClient();

  const { data: roles } = await admin
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "orgnz")
    .limit(1);
  const tenantId = (roles?.[0]?.tenant_id as string | undefined) ?? null;
  if (!tenantId) {
    // User has no orgnz tenant — should never happen for a funnel-completer,
    // but fail safe rather than create one inline (postAuthSeed owns tenant
    // creation; duplicating it here invites drift).
    redirect("/orgnz");
  }

  await seedEventFromCalcState(
    admin,
    { userId: user.id, email: user.email ?? "" },
    tenantId,
    state,
    sessionToken,
  );

  c.delete("evntcue_capture_session");
  c.delete("evntcue_calc_state");

  redirect("/orgnz");
}
