"use server";

import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type Role = "vndr" | "venu";
type PortalIntent = "vndr" | "venue";

const PORTAL_INTENT: Record<Role, PortalIntent> = { vndr: "vndr", venu: "venue" };

export type CaptureResult = { ok: true } | { ok: false; error: string };

export async function captureComingSoon(role: Role, email: string): Promise<CaptureResult> {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: "Enter a valid email." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const ua = h.get("user-agent") || null;

  const supabase = createAdminClient();
  const { error } = await supabase.from("landing_capture_sessions").insert({
    session_token: randomUUID(),
    portal_intent: PORTAL_INTENT[role],
    email_captured: trimmed,
    ip_address: ip,
    user_agent: ua,
  });

  if (error) return { ok: false, error: "Could not save right now. Try again." };
  return { ok: true };
}
