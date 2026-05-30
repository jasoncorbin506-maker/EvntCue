"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocale } from "@/i18n/locale";

/**
 * Door A — Vndr ghost-claim server action. Mirrors claim-venue.ts (migration
 * 025 / Venu Door A pattern) with three differences:
 *   - target table is `vendors` (created by migration 041)
 *   - tenant_type is 'vndr' (per the tenant_type enum in migration 001)
 *   - acquisition_lane is set to 'warm_intro' (per migration 041 enum)
 *
 * Token model (migration 041):
 *   - Plaintext token lives only in the outreach email URL.
 *   - DB stores sha256(token) on `vendors.invite_token_hash`.
 *   - Single-use enforced by setting `invite_token_consumed_at` here.
 *   - 14-day expiry enforced by `invite_token_expires_at > now()`.
 *
 * Per master spec §75 + Vndr Locked architecture: "the token in the URL *is*
 * the verification." No second factor — possession of the link from a curated
 * warm-intro list is the trust source.
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
  const { data: vendor, error: vendorErr } = await admin
    .from("vendors")
    .select(
      "id, display_name, tenant_id, invite_token_expires_at, invite_token_consumed_at, claim_status",
    )
    .eq("invite_token_hash", tokenHash)
    .maybeSingle();

  if (vendorErr || !vendor) {
    return { ok: false, error: "This claim link isn't recognized." };
  }
  if (vendor.invite_token_consumed_at) {
    return { ok: false, error: "This claim link has already been used." };
  }
  if (vendor.tenant_id) {
    return { ok: false, error: "This Vndr profile has already been claimed." };
  }
  if (
    !vendor.invite_token_expires_at ||
    new Date(vendor.invite_token_expires_at as string) <= new Date()
  ) {
    return { ok: false, error: "This claim link has expired." };
  }

  // 2. Auth resolution. Same three cases as Venu:
  //   (a) Already signed in (e.g., an Orgnz who also operates as a vendor) —
  //       skip signUp, claim under the existing user.
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
    const emailRedirectTo = `${proto}://${host}/vndr/discover?welcome=claim`;

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

    if (authErr) return { ok: false, error: authErr.message };
    if (!authData.user) {
      return {
        ok: false,
        error: `We sent a confirmation link to ${email}. Click it to finish claiming your profile.`,
      };
    }
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

  // 4. Create the Vndr tenant. `name` = the vendor's display name (this is
  // what the recipient already sees on outreach + dashboard chrome).
  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .insert({
      name: vendor.display_name,
      type: "vndr", // DB enum is 'vndr'; URL is /vndr/* (proxy.ts maps).
      language_preference: locale,
    })
    .select("id")
    .single();
  if (tenantErr || !tenant) {
    return { ok: false, error: "Could not create your workspace." };
  }
  const tenantId = tenant.id as string;

  // 5. Bind the user to the tenant in the Vndr role.
  const { error: roleErr } = await admin.from("user_roles").insert({
    user_id: userId,
    tenant_id: tenantId,
    role: "vndr",
    is_primary: true,
  });
  if (roleErr) return { ok: false, error: "Could not assign your role." };

  // 6. Bind the vendor to the tenant + mark consumed + lock acquisition_lane
  // to 'warm_intro' (Door A signature). Single UPDATE — if it races against
  // another claim attempt, the second loses on the IS NULL checks.
  const nowIso = new Date().toISOString();
  const { error: updateErr } = await admin
    .from("vendors")
    .update({
      tenant_id: tenantId,
      claimed_at: nowIso,
      invite_token_consumed_at: nowIso,
      claim_status: "published",
      acquisition_lane: "warm_intro",
    })
    .eq("id", vendor.id)
    .is("tenant_id", null)
    .is("invite_token_consumed_at", null);
  if (updateErr) {
    return { ok: false, error: "Could not bind your profile. Try the link again." };
  }

  // 7. Hydrate the auth session for the redirect target.
  void (await createClient()).auth.getUser();

  return { ok: true, redirectTo: "/vndr/discover?welcome=claim" };
}

/**
 * Wrapper that mirrors `submitClaim` from Venu — calls the action, redirects
 * on success (server-side `redirect()` throws), returns the error shape on
 * failure for the client form to render.
 */
export async function submitClaim(formData: FormData): Promise<ClaimResult> {
  const result = await submitClaimAction(formData);
  if (result.ok) redirect(result.redirectTo);
  return result;
}
