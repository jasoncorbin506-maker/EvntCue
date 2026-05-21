"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SetPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * PARKING_LOT #55 — final step of recovery. Caller must already be in a
 * recovery session (established by /auth/recover route handler). Updates
 * the user's password and redirects into the platform.
 */
export async function setPasswordAction(formData: FormData): Promise<SetPasswordResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords didn't match. Try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Your recovery link expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  redirect("/orgnz");
}
