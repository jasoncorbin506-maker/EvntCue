"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  runPinterestScraper,
  ApifyError,
  type ApifyPinterestItem,
} from "@/lib/moodboard/apify-client";
import {
  fetchAndRehostImage,
  RehostError,
} from "@/lib/moodboard/pinterest-import";

/**
 * Mood Board Chunk C — server action: import 1+ Pinterest images from a
 * paste URL. Pin URLs land 1 image; board URLs land up to the
 * remaining-on-this-board cap (PER_BOARD_CAP - current pin count).
 *
 * Re-host every image to the private `mood-board-renders` bucket — Lock 18
 * (we own the bytes) + link rot resilience. The Pinterest URL is NOT
 * preserved on the pin row; the snapshot serializer only sees `source='url'`.
 *
 * Auth model mirrors upload-image.ts: anon client surfaces the user;
 * admin client does the Storage write + pin INSERT.
 */

const PER_BOARD_CAP = 100;
/** Defensive hard cap — protects against runaway costs if a future Apify
 *  actor change starts returning huge result sets. */
const HARD_CAP = 200;
/** Cap on errors surfaced to the user — dedupe + truncate. */
const MAX_ERRORS_SURFACED = 3;

export type ImportInput = {
  boardId: string;
  pinterestUrl: string;
};

export type ImportPinResult = {
  id: string;
  url: string;
  signed_url: string;
  tags: string[];
};

export type ImportResult =
  | {
      ok: true;
      imported: number;
      skipped: number;
      capped: boolean;
      pins: ImportPinResult[];
      errors: string[];
    }
  | { ok: false; error: string };

const PINTEREST_URL_PATTERN =
  /^https?:\/\/(www\.)?pinterest\.(com|ca|co\.uk|de|fr|au|jp|nz|mx|es|it|pt|nl|se|dk|fi|no|jp|kr|cl)\/(pin|user|[\w-]+)\//;
const PINTEREST_SHORT_PATTERN = /^https?:\/\/pin\.it\/[\w]+\/?$/;

export async function importPinterestUrl(
  input: ImportInput,
): Promise<ImportResult> {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // 2. Validate URL
  const url = input.pinterestUrl.trim();
  if (!PINTEREST_URL_PATTERN.test(url) && !PINTEREST_SHORT_PATTERN.test(url)) {
    return { ok: false, error: "That doesn't look like a Pinterest URL." };
  }

  const admin = createAdminClient();

  // 3. Board ownership + capacity gate (defense in depth on top of RLS)
  const { data: board, error: boardErr } = await admin
    .from("mood_boards")
    .select("id, tenant_id, owner_id")
    .eq("id", input.boardId)
    .maybeSingle();
  if (boardErr) {
    return { ok: false, error: `Board lookup failed: ${boardErr.message}` };
  }
  if (!board) return { ok: false, error: "Board not found." };
  if (board.owner_id !== user.id) {
    return { ok: false, error: "You don't own this board." };
  }

  const { count: existingCount } = await admin
    .from("mood_board_pins")
    .select("id", { count: "exact", head: true })
    .eq("board_id", input.boardId)
    .is("deleted_at", null);

  const used = existingCount ?? 0;
  const remaining = PER_BOARD_CAP - used;
  if (remaining <= 0) {
    return {
      ok: false,
      error: "Your board is full at 100 pins — drop a few to bring more in.",
    };
  }

  const limit = Math.min(remaining, HARD_CAP);

  // 4. Call Apify
  let items: ApifyPinterestItem[];
  try {
    items = await runPinterestScraper({
      startUrls: [{ url }],
      maxItems: limit,
    });
  } catch (err) {
    if (err instanceof ApifyError) {
      // 4xx with a body that looks Pinterest-shaped → bad URL; otherwise generic.
      if (err.status >= 400 && err.status < 500) {
        return {
          ok: false,
          error: "Couldn't reach that pin — check the URL.",
        };
      }
      return { ok: false, error: "Pinterest is being slow — try again?" };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Something broke.",
    };
  }

  // 5. Filter video pins (we re-host stills only) + items without imageUrl
  const usable = items.filter(
    (it) => !it.isVideo && typeof it.imageUrl === "string" && it.imageUrl.length > 0,
  );

  if (usable.length === 0) {
    return {
      ok: false,
      error: "We couldn't find any images in that link.",
    };
  }

  // 6. Iterate: fetch + re-host + INSERT pin row per usable item
  const toIngest = usable.slice(0, remaining);
  const truncated = items.length > remaining;

  const importedPins: ImportPinResult[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (const item of toIngest) {
    try {
      const rehosted = await fetchAndRehostImage({
        sourceUrl: item.imageUrl!,
        tenantId: board.tenant_id as string,
        boardId: board.id as string,
        supabase: admin,
      });

      const { data: pin, error: pinErr } = await admin
        .from("mood_board_pins")
        .insert({
          board_id: board.id,
          source: "url",
          url: rehosted.storagePath,
          added_by: user.id,
          position: 0,
        })
        .select("id")
        .single();

      if (pinErr || !pin) {
        // Best-effort: drop the just-uploaded object since the pin row failed.
        await admin.storage
          .from("mood-board-renders")
          .remove([rehosted.storagePath]);
        skipped++;
        if (errors.length < MAX_ERRORS_SURFACED) {
          errors.push(pinErr?.message ?? "Pin insert failed");
        }
        continue;
      }

      importedPins.push({
        id: pin.id as string,
        url: rehosted.storagePath,
        signed_url: rehosted.signedUrl,
        tags: [],
      });
    } catch (err) {
      skipped++;
      if (errors.length < MAX_ERRORS_SURFACED) {
        if (err instanceof RehostError) {
          errors.push(err.message);
        } else {
          errors.push(err instanceof Error ? err.message : "Unknown error");
        }
      }
    }
  }

  if (importedPins.length === 0) {
    return {
      ok: false,
      error: errors[0] ?? "Couldn't bring in any pins.",
    };
  }

  revalidatePath("/mood-board");

  return {
    ok: true,
    imported: importedPins.length,
    skipped,
    capped: truncated,
    pins: importedPins,
    errors,
  };
}
