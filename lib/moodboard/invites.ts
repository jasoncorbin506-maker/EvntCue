import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Moodboard invite reads (Lock 30 Phase D). A buyer invites a seller TENANT to
 * view their (primary) moodboard; the grant is a non-revoked mood_board_invites
 * row, enforced by the cross-tenant RLS from migration 087.
 */

/** The buyer's primary board (most-recent for the tenant), or null. */
export async function getBuyerBoardId(buyerTenantId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mood_boards")
    .select("id")
    .eq("tenant_id", buyerTenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.id as string | null) ?? null;
}

/** Seller tenant ids with an ACTIVE (non-revoked) invite on the buyer's board. */
export async function getInvitedTenantIds(buyerTenantId: string): Promise<string[]> {
  const boardId = await getBuyerBoardId(buyerTenantId);
  if (!boardId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("mood_board_invites")
    .select("invited_tenant_id")
    .eq("board_id", boardId)
    .is("revoked_at", null);
  return (data ?? []).map((r) => (r as Record<string, unknown>).invited_tenant_id as string);
}

export type SharedPin = { url: string; alt: string | null };

/**
 * Seller-side "their vision": the pins of a buyer's board the current seller
 * tenant has been invited to. Runs under the seller's session — the 087 RLS on
 * mood_boards only returns the board if the seller holds a live invite, so that
 * SELECT *is* the authorization gate. Once authorized, pin image URLs are signed
 * via admin (the mood-board-renders bucket is private).
 */
export async function getSharedMoodboardPins(buyerTenantId: string): Promise<SharedPin[]> {
  const supabase = await createClient();
  // RLS returns this board only if the caller's tenant is invited (mig 087).
  const { data: boards } = await supabase
    .from("mood_boards")
    .select("id")
    .eq("tenant_id", buyerTenantId);
  const boardIds = (boards ?? []).map((b) => (b as Record<string, unknown>).id as string);
  if (boardIds.length === 0) return [];

  const { data: pins } = await supabase
    .from("mood_board_pins")
    .select("source, url")
    .in("board_id", boardIds)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  const admin = createAdminClient();
  const out: SharedPin[] = [];
  for (const p of pins ?? []) {
    const row = p as Record<string, unknown>;
    const source = row.source as string;
    const url = (row.url as string | null) ?? "";
    if (!url || url.startsWith("chip://")) continue; // skip chip sentinels
    if (url.startsWith("http")) {
      out.push({ url, alt: null });
    } else if (source === "upload" || source === "render") {
      // Storage path in the private mood-board-renders bucket — sign it.
      const { data: signed } = await admin.storage
        .from("mood-board-renders")
        .createSignedUrl(url, 60 * 60);
      if (signed?.signedUrl) out.push({ url: signed.signedUrl, alt: null });
    }
  }
  return out;
}
