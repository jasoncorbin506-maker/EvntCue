import type { SupabaseClient } from "@supabase/supabase-js";
import { checkSubscription } from "@/lib/subscriptions/check";

/**
 * Mood-board freemium photo cap (Lock 3 tiering).
 *
 * Model (per the "free board, paid marathon" framing): a free user gets a
 * generous-but-bounded number of THEIR OWN photos; paid users get the full
 * volume. The cap counts only user-supplied pictures — AI renders ('render')
 * and decorative chips ('chip', incl. the `chip://` sentinel that pre-039
 * code stored as source='url') are the free magic and are NOT counted.
 *
 * The actual upgrade CHECKOUT is Phase 4 / Stripe (not wired). This gate works
 * today against the existing checkSubscription() tier; pre-Phase-4 a "paid"
 * row is inserted by hand. So the gate + funnel logic ship now; only taking
 * money waits.
 */

export const FREE_PHOTO_CAP = 10;
export const PAID_PHOTO_CAP = 200;

/** Pin sources that count as user-supplied photos against the cap. */
export const CAPPED_PIN_SOURCES = ["upload", "url", "unsplash", "pexels"] as const;

export type PhotoCap = { cap: number; isFree: boolean };

export async function moodBoardPhotoCap(
  userId: string,
  tenantId: string | null,
): Promise<PhotoCap> {
  const tier = await checkSubscription(userId, tenantId);
  const isFree = tier === "free";
  return { cap: isFree ? FREE_PHOTO_CAP : PAID_PHOTO_CAP, isFree };
}

/**
 * Count the user-supplied photos currently on a board. Single source of truth
 * for "what counts" so the upload and import doors can't drift apart. Excludes
 * soft-deleted pins, renders/chips, and the `chip://` sentinel.
 */
export async function countBoardPhotos(
  admin: SupabaseClient,
  boardId: string,
): Promise<number> {
  const { count } = await admin
    .from("mood_board_pins")
    .select("id", { count: "exact", head: true })
    .eq("board_id", boardId)
    .is("deleted_at", null)
    .in("source", [...CAPPED_PIN_SOURCES])
    .not("url", "like", "chip://%");
  return count ?? 0;
}

/** The user-facing message when a board is at its photo cap. */
export function photoCapMessage(cap: PhotoCap): string {
  return cap.isFree
    ? `You've reached the ${FREE_PHOTO_CAP}-photo limit on the free plan. Upgrade to add up to ${PAID_PHOTO_CAP}.`
    : `Your board is full at ${PAID_PHOTO_CAP} photos — remove a few to add more.`;
}
