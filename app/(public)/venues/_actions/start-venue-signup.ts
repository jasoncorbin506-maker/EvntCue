"use server";

import { cookies } from "next/headers";
import { signUpAction, type AuthResult } from "@/app/(auth)/login/_actions/auth";

/**
 * Door B Venu signup — the /venues "Get started" modal collects the venue's
 * identity + email + password and creates the account in one step.
 *
 * We stash the venue identity (name, contact, city) in a short-lived cookie,
 * then delegate email+password auth to the shared signUpAction (the single
 * source of auth truth — handles email-confirm, existing-email, errors). On
 * success postAuthSeed reads the cookie to seed the `venues` row + set
 * users.full_name (lib/auth/post-auth-seed.ts → seedVenueFromStage0).
 *
 * Returns AuthResult so the modal can route on success / surface errors —
 * exactly like LoginForm. Validates the three venue fields here; email +
 * password validation lives in signUpAction (not duplicated).
 */
export async function startVenueSignup(formData: FormData): Promise<AuthResult> {
  const venueName = String(formData.get("venueName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (venueName.length < 2) return { ok: false, error: "Tell us your venue's name." };
  if (contactName.length < 2) {
    return { ok: false, error: "Who should we reach? Add a contact name." };
  }
  if (city.length < 2) return { ok: false, error: "Which city are you in?" };

  const c = await cookies();
  c.set(
    // state defaults to TX — EvntCue is DFW/Texas-anchored at launch; the venue
    // can refine it from the dashboard.
    "evntcue_venue_stage0",
    JSON.stringify({ venueName, contactName, city, state: "TX" }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2,
      path: "/",
    },
  );

  // The venue role hint drives postAuthSeed: venue tenant + role + venues row,
  // no orgnz auto-spawn (Lock 26). mode=signup so the shared action signs up.
  formData.set("role", "venue");
  formData.set("mode", "signup");
  return signUpAction(formData);
}
