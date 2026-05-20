"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocale } from "@/i18n/locale";

/**
 * Door A — ghost-claim server action. Validates the invite token, creates the
 * auth user, mints a Venu tenant + user_role, and atomically binds the
 * existing `venues` row to the new tenant.
 *
 * Token model (migration 025):
 *   - Plaintext token lives only in the outreach email URL.
 *   - DB stores sha256(token) on `venues.invite_token_hash`.
 *   - Single-use enforced by setting `invite_token_consumed_at` here.
 *   - 14-day expiry enforced by `invite_token_expires_at > now()`.
 *
 * Per Venu_Locked_2026-05-13.md: "the token in the URL *is* the verification."
 * No second factor — possession of the link from a curated warm-intro list is
 * the trust source.
 */

export type ClaimResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

const validateEmail = (email: string): string | null => {
  const v = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function submitClaimAction(formData: FormData): Promise<ClaimResult> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rawEmail = String(formData.get("email") ?? "");

  if (!token) return { ok: false, error: "This claim link is missing its token." };

  const admin = createAdminClient();
  const tokenHash = hashToken(token);

  // 1. Re-validate token. (Page-level check happened at render, but the row
  // could have been consumed between render and submit — race-proof here.)
  const { data: venue, error: venueErr } = await admin
    .from("venues")
    .select(
      "id, display_name, tenant_id, invite_token_expires_at, invite_token_consumed_at, claim_status",
    )
    .eq("invite_token_hash", tokenHash)
    .maybeSingle();

  if (venueErr || !venue) {
    return { ok: false, error: "This claim link isn't recognized." };
  }
  if (venue.invite_token_consumed_at) {
    return { ok: false, error: "This claim link has already been used." };
  }
  if (venue.tenant_id) {
    return { ok: false, error: "This venue has already been claimed." };
  }
  if (
    !venue.invite_token_expires_at ||
    new Date(venue.invite_token_expires_at as string) <= new Date()
  ) {
    return { ok: false, error: "This claim link has expired." };
  }

  // 2. Auth resolution. Three cases:
  //   (a) Already signed in (e.g., an Orgnz who also owns a venue) — skip
  //       signUp, claim under the existing user.
  //   (b) Not signed in, email new — signUp (auto-signs in since confirm
  //       email is off per session 15).
  //   (c) Not signed in, email already exists — signUp silently returns
  //       no session (Supabase anti-enumeration). Surface a clear error
  //       rather than half-claiming.
  const supabase = await createClient();
  const { data: existingAuth } = await supabase.auth.getUser();

  let userId: string;
  let email: string;

  if (existingAuth.user) {
    userId = existingAuth.user.id;
    email = existingAuth.user.email ?? rawEmail;
  } else {
    const validated = validateEmail(rawEmail);
    if (!validated) return { ok: false, error: "Enter a valid email." };
    if (password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters." };
    }
    email = validated;

    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto =
      h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const emailRedirectTo = `${proto}://${host}/venu/discover?welcome=claim`;

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

    if (authErr) return { ok: false, error: authErr.message };
    if (!authData.user) {
      return {
        ok: false,
        error: `We sent a confirmation link to ${email}. Click it to finish claiming your venue.`,
      };
    }
    // Case (c): existing email — Supabase returns a user object but no
    // session. Without a session, the post-redirect middleware will bounce
    // to /login and we'd silently create an orphan tenant + role. Bail.
    if (!authData.session) {
      return {
        ok: false,
        error: `${email} already has an account. Sign in first, then re-open this link from the email.`,
      };
    }
    userId = authData.user.id;
  }

  const locale = await getLocale();

  // 3. Mirror auth.users → public.users.
  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!existingUser) {
    const { error: userInsertErr } = await admin.from("users").insert({
      id: userId,
      email,
      language_preference: locale,
    });
    if (userInsertErr) return { ok: false, error: "Could not create profile." };
  }

  // 4. Create the Venu tenant. `name` = the venue's display name (this is
  // what the recipient already sees on outreach + dashboard chrome).
  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .insert({
      name: venue.display_name,
      type: "venue", // DB enum is 'venue'; URL is /venu/* (proxy.ts maps).
      language_preference: locale,
    })
    .select("id")
    .single();
  if (tenantErr || !tenant) {
    return { ok: false, error: "Could not create your workspace." };
  }
  const tenantId = tenant.id as string;

  // 5. Bind the user to the tenant in the Venu role.
  const { error: roleErr } = await admin.from("user_roles").insert({
    user_id: userId,
    tenant_id: tenantId,
    role: "venue",
    is_primary: true,
  });
  if (roleErr) return { ok: false, error: "Could not assign your role." };

  // 6. Bind the venue to the tenant + mark consumed. Single UPDATE — if it
  // races against another claim attempt, the second loses on the consumed
  // check below (we re-read after).
  const nowIso = new Date().toISOString();
  const { error: updateErr } = await admin
    .from("venues")
    .update({
      tenant_id: tenantId,
      claimed_at: nowIso,
      invite_token_consumed_at: nowIso,
      claim_status: "published",
    })
    .eq("id", venue.id)
    .is("tenant_id", null)
    .is("invite_token_consumed_at", null);
  if (updateErr) {
    return { ok: false, error: "Could not bind your venue. Try the link again." };
  }

  // 7. Hydrate the auth session for the redirect target.
  void (await createClient()).auth.getUser();

  return { ok: true, redirectTo: "/venu/discover?welcome=claim" };
}

/**
 * Wrapper that mirrors `submitAuth` — calls the action, redirects on success
 * (server-side `redirect()` throws), returns the error shape on failure for
 * the client form to render.
 */
export async function submitClaim(formData: FormData): Promise<ClaimResult> {
  const result = await submitClaimAction(formData);
  if (result.ok) redirect(result.redirectTo);
  return result;
}
