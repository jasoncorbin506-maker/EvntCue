"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type AttachEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Email fallback on the preview page — attaches an email to the existing
 * landing_capture_sessions row identified by the cookie. Used when the
 * user wants their budget summary mailed without committing to signup.
 */
export async function attachEmailToSession(email: string): Promise<AttachEmailResult> {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: "Enter a valid email." };
  }

  const c = await cookies();
  const sessionToken = c.get("evntcue_capture_session")?.value;
  if (!sessionToken) {
    return { ok: false, error: "Your session has expired. Start over from the calculator." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("landing_capture_sessions")
    .update({ email_captured: trimmed })
    .eq("session_token", sessionToken);

  if (error) return { ok: false, error: "Could not save right now. Try again." };
  return { ok: true };
}
