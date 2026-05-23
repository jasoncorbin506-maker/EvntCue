"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Mood Board Chunk E — generate (or fetch) a public share token for a
 * rendered pin.
 *
 * Per Lock 18 (image sourcing + share semantics): the token IS the
 * consent grant. A pin with a non-NULL `public_share_token` is publicly
 * accessible at `/shared/render/[token]`; absent the token, the image
 * stays private to the owning Orgnz / Plnr.
 *
 * Idempotent: if the pin already has a token, return it as-is (same URL,
 * same expiry semantics). This means a user tapping Share twice on the
 * same photo gets the same shareable URL — useful for re-sending.
 *
 * Per Lock 22 forgiveness: if the user soft-deletes a shared pin via the
 * trash flow, the token survives in the row but the public route will
 * 404 on `deleted_at IS NOT NULL`. Restoring the pin re-activates the
 * share URL with the same token. Documented in the public route.
 */

const TOKEN_BYTES = 24; // 24 bytes → 32-char base64url, ample collision resistance.

export type GenerateShareTokenInput = {
  pinId: string;
};

export type GenerateShareTokenResult =
  | { ok: true; token: string; url: string }
  | { ok: false; error: string };

function makeToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export async function generateShareToken(
  input: GenerateShareTokenInput,
): Promise<GenerateShareTokenResult> {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!input.pinId) return { ok: false, error: "Missing pin id." };

  const admin = createAdminClient();

  // 2. Load pin — must be a render pin and not deleted.
  const { data: pin, error: pinErr } = await admin
    .from("mood_board_pins")
    .select("id, board_id, source, public_share_token, deleted_at")
    .eq("id", input.pinId)
    .maybeSingle();
  if (pinErr) return { ok: false, error: `Pin lookup failed: ${pinErr.message}` };
  if (!pin) return { ok: false, error: "Pin not found." };
  if (pin.deleted_at) {
    return { ok: false, error: "Cannot share a removed pin." };
  }
  if (pin.source !== "render") {
    return { ok: false, error: "Only rendered pins can be shared." };
  }

  // 3. Board ownership check.
  const { data: board, error: boardErr } = await admin
    .from("mood_boards")
    .select("id, owner_id")
    .eq("id", pin.board_id)
    .maybeSingle();
  if (boardErr) return { ok: false, error: `Board lookup failed: ${boardErr.message}` };
  if (!board) return { ok: false, error: "Board not found." };
  if (board.owner_id !== user.id) {
    return { ok: false, error: "You don't own this board." };
  }

  // 4. Reuse existing token if present (idempotent).
  let token = pin.public_share_token as string | null;
  if (!token) {
    token = makeToken();
    const { error: updErr } = await admin
      .from("mood_board_pins")
      .update({
        public_share_token: token,
        share_created_at: new Date().toISOString(),
      })
      .eq("id", pin.id);
    if (updErr) {
      return { ok: false, error: `Could not mint share token: ${updErr.message}` };
    }
  }

  // 5. Compose the absolute share URL using the inbound request host.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/shared/render/${token}`;

  return { ok: true, token, url };
}
