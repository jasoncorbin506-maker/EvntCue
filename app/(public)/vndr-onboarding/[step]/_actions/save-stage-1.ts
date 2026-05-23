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
 * vendors.primary_sub_type (migration 042) for the currently-signed-in vndr.
 *
 * Uses the RLS-scoped client — migration 041's vendors_update policy allows
 * the owning tenant to UPDATE their own row (USING tenant_id IN
 * current_user_tenants()). No admin client needed; the user has the vndr
 * role + the row's tenant matches their tenant.
 *
 * Validates inputs against the canonical catalog (data/vndr-categories.ts)
 * to defend against arbitrary form-submission payloads. Sub-type may be
 * null (drill is optional); when provided, it must belong to the selected
 * category's sub-types list.
 *
 * Returns a result object; the client (Stage1.tsx) handles navigation via
 * router.push on success and shows the error inline on failure.
 */

export type SaveStage1Result =
  | { ok: true }
  | { ok: false; error: string };

export async function saveStage1Action(input: {
  category: VndrCategoryKey;
  subType: string | null;
}): Promise<SaveStage1Result> {
  if (!isVndrCategoryKey(input.category)) {
    return { ok: false, error: "Pick a category to continue." };
  }

  const cat = VNDR_CATEGORIES.find((c) => c.key === input.category);
  if (!cat) {
    return { ok: false, error: "Pick a category to continue." };
  }

  // Sub-type, if provided, must belong to the selected category's catalog.
  if (input.subType !== null) {
    const subTypes: readonly string[] = cat.subTypes;
    if (!subTypes.includes(input.subType)) {
      return {
        ok: false,
        error: "That sub-type doesn't match the category. Pick again.",
      };
    }
  }

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
      primary_sub_type: input.subType,
    })
    .eq("id", vendor.id);

  if (error) {
    return { ok: false, error: "Could not save right now. Try again." };
  }

  return { ok: true };
}
