"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizer } from "@/lib/orgnz/current-organizer";
import { getBuyerBoardId } from "@/lib/moodboard/invites";

/**
 * Buyer-controlled moodboard invites (Lock 30 Phase D). The organizer invites /
 * revokes a seller TENANT's view access to their primary moodboard. Backed by
 * mood_board_invites (migration 087); the cross-tenant read RLS rides the
 * non-revoked invite. Negative lock: access is invite-only and revocable here.
 */

export type MoodboardInviteResult = { ok: true } | { ok: false; error: string };

export async function inviteSellerToMoodboard(
  sellerTenantId: string,
): Promise<MoodboardInviteResult> {
  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, error: "Not signed in." };
  if (!sellerTenantId) return { ok: false, error: "Missing seller." };

  const boardId = await getBuyerBoardId(organizer.tenantId);
  if (!boardId) {
    return { ok: false, error: "Start a mood board first, then share it." };
  }

  const supabase = await createClient();
  // Upsert on (board_id, invited_tenant_id) — re-inviting a revoked seller
  // clears revoked_at. tenant_id pair is a plain unique key (safe onConflict).
  const { error } = await supabase
    .from("mood_board_invites")
    .upsert(
      {
        board_id: boardId,
        invited_tenant_id: sellerTenantId,
        invited_by: organizer.userId,
        revoked_at: null,
      },
      { onConflict: "board_id,invited_tenant_id" },
    );
  if (error) return { ok: false, error: "Couldn't share your mood board — try again." };

  revalidatePath("/orgnz/browse");
  return { ok: true };
}

export async function revokeSellerMoodboardInvite(
  sellerTenantId: string,
): Promise<MoodboardInviteResult> {
  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, error: "Not signed in." };

  const boardId = await getBuyerBoardId(organizer.tenantId);
  if (!boardId) return { ok: true }; // nothing to revoke

  const supabase = await createClient();
  const { error } = await supabase
    .from("mood_board_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("board_id", boardId)
    .eq("invited_tenant_id", sellerTenantId)
    .is("revoked_at", null);
  if (error) return { ok: false, error: "Couldn't stop sharing — try again." };

  revalidatePath("/orgnz/browse");
  return { ok: true };
}
