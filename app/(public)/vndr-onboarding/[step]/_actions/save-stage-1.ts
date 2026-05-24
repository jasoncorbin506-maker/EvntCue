"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import {
  VNDR_CATEGORIES,
  type VndrCategoryKey,
  isVndrCategoryKey,
} from "@/data/vndr-categories";

/**
 * Stage 1 server action. Writes vendors.primary_category +
 * vendors.primary_sub_type (migration 042) + vendors.sub_types (migration
 * 047, V-1c multi-select) for the currently-signed-in vndr.
 *
 * Uses the RLS-scoped client — migration 041's vendors_update policy allows
 * the owning tenant to UPDATE their own row (USING tenant_id IN
 * current_user_tenants()). No admin client needed; the user has the vndr
 * role + the row's tenant matches their tenant.
 *
 * Validates inputs against the canonical catalog (data/vndr-categories.ts)
 * to defend against arbitrary form-submission payloads. subTypes may be
 * empty (drill is optional); when non-empty, every element must belong to
 * the selected category's sub-types list AND be unique.
 *
 * V-1c additive-write contract (locked session 18t):
 *   - subTypes[0] (or null if empty) → primary_sub_type   (back-compat)
 *   - subTypes (full ordered array)  → sub_types          (multi-select)
 * Both writes happen in a single UPDATE; the back-compat invariant
 * (sub_types[0] === primary_sub_type when non-empty) is preserved by
 * deriving both from the same input.
 *
 * No schema-level cap on subTypes.length — UI nudges at 3, but the server
 * accepts any non-empty array of valid sub-types. Over-constraining here
 * would create a "your save was lost" failure class for power users with
 * genuinely cross-discipline business shapes.
 *
 * Returns a result object; the client (Stage1.tsx) handles navigation via
 * router.push on success and shows the error inline on failure.
 */

export type SaveStage1Result =
  | { ok: true }
  | { ok: false; error: string };

export async function saveStage1Action(input: {
  category: VndrCategoryKey;
  subTypes: string[];
}): Promise<SaveStage1Result> {
  if (!isVndrCategoryKey(input.category)) {
    return { ok: false, error: "Pick a category to continue." };
  }

  const cat = VNDR_CATEGORIES.find((c) => c.key === input.category);
  if (!cat) {
    return { ok: false, error: "Pick a category to continue." };
  }

  if (!Array.isArray(input.subTypes)) {
    return { ok: false, error: "Could not save right now. Try again." };
  }

  // Every selected sub-type must belong to the category's catalog. Dedupe
  // defensively so a client-side state glitch can't double-write a chip.
  const validSet = new Set<string>(cat.subTypes);
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const st of input.subTypes) {
    if (typeof st !== "string") {
      return { ok: false, error: "Could not save right now. Try again." };
    }
    if (!validSet.has(st)) {
      return {
        ok: false,
        error: "A sub-type doesn't match the category. Pick again.",
      };
    }
    if (seen.has(st)) continue;
    seen.add(st);
    cleaned.push(st);
  }

  const primarySubType = cleaned.length > 0 ? cleaned[0] : null;

  const vendor = await getCurrentVendor();
  if (!vendor) {
    return {
      ok: false,
      error: "Your session expired. Sign in again to continue.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .update({
      primary_category: input.category,
      primary_sub_type: primarySubType,
      sub_types: cleaned,
    })
    .eq("id", vendor.id);

  if (error) {
    return { ok: false, error: "Could not save right now. Try again." };
  }

  return { ok: true };
}
