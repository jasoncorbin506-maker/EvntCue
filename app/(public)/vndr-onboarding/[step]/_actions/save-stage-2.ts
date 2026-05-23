"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { isDfwNeighborhoodSlug } from "@/data/dfw-neighborhoods";

/**
 * Stage 2 server action. Writes the Stage-2 business columns on vendors:
 *   - display_name      (overwrites the email placeholder seeded by
 *                        postAuthSeed.seedVendorFromStage0)
 *   - contact_phone     (TEXT — minimal validation; staff curate)
 *   - years_in_business (INT — 0-60 cap mirrors the mockup's input attrs)
 *   - website_url       (TEXT — minimal validation; allow bare domains)
 *   - founding_story    (TEXT — Cue context per master spec §75)
 *   - service_zips      (TEXT[] — slugs from data/dfw-neighborhoods.ts)
 *
 * Per Jason's V-1b call: contact_name dropped (auth email + display_name
 * cover the surface). Stage 2's "Your name" field is omitted from the form.
 *
 * RLS-scoped writes via createClient. The vendors_update policy from
 * migration 041 allows the owning tenant to UPDATE their own row.
 *
 * The Signature Board upload + style-fingerprint pipeline is OUT OF SCOPE
 * for V-1b (Chunk V-3 / mood-board reuse — see master spec §75 Signature
 * Board subsection). The Stage 2 component stubs that area visually but
 * persists nothing related to it.
 */

const trim = (s: unknown): string =>
  typeof s === "string" ? s.trim() : "";

export type SaveStage2Result =
  | { ok: true }
  | { ok: false; error: string };

export async function saveStage2Action(
  formData: FormData,
): Promise<SaveStage2Result> {
  const displayName = trim(formData.get("displayName"));
  const contactPhone = trim(formData.get("contactPhone"));
  const yearsRaw = trim(formData.get("yearsInBusiness"));
  const websiteUrl = trim(formData.get("websiteUrl"));
  const foundingStory = trim(formData.get("foundingStory"));
  // service_zips — repeated field, one entry per selected chip.
  const serviceZipsRaw = formData.getAll("serviceZips");

  if (displayName.length === 0) {
    return { ok: false, error: "Your business name is required." };
  }
  if (displayName.length > 120) {
    return { ok: false, error: "Business name is too long." };
  }

  // Years — accept blank (leaves column NULL) or integer 0–60.
  let yearsInBusiness: number | null = null;
  if (yearsRaw.length > 0) {
    const n = parseInt(yearsRaw, 10);
    if (!Number.isInteger(n) || n < 0 || n > 60) {
      return {
        ok: false,
        error: "Years in business should be a number from 0 to 60.",
      };
    }
    yearsInBusiness = n;
  }

  // Service zips — keep only known DFW slugs. Silently drops unknown values
  // (handles a stale chip in the client form without erroring the submit).
  const serviceZips: string[] = serviceZipsRaw
    .map((v) => (typeof v === "string" ? v : ""))
    .filter(isDfwNeighborhoodSlug);

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
      display_name: displayName,
      contact_phone: contactPhone.length > 0 ? contactPhone : null,
      years_in_business: yearsInBusiness,
      website_url: websiteUrl.length > 0 ? websiteUrl : null,
      founding_story: foundingStory.length > 0 ? foundingStory : null,
      service_zips: serviceZips.length > 0 ? serviceZips : null,
    })
    .eq("id", vendor.id);

  if (error) {
    return { ok: false, error: "Could not save right now. Try again." };
  }

  return { ok: true };
}
