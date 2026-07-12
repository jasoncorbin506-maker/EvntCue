"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GATE_COOKIE,
  GATE_COOKIE_MAX_AGE,
  gateCookieValue,
  sanitizeNextPath,
} from "@/lib/site-gate";

export type GateResult = { ok: false; error: string };

export async function enterAccessCode(input: {
  code: string;
  next?: string | null;
}): Promise<GateResult> {
  const accessCode = process.env.SITE_ACCESS_CODE;
  // Gate switched off since the page rendered — just let them through.
  if (!accessCode) redirect(sanitizeNextPath(input.next));

  if (input.code.trim() !== accessCode) {
    return { ok: false, error: "That code isn’t right. Try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE, await gateCookieValue(accessCode), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_COOKIE_MAX_AGE,
  });

  redirect(sanitizeNextPath(input.next));
}
