import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Venue portfolio photos for the venu-side management page (Lock 30 Phase B).
 * Read under the venue's own RLS (vnph_select scopes to own tenant). Resolves
 * the public URL from the venue-photos bucket for immediate rendering.
 */
export type VenuePhoto = {
  id: string;
  storagePath: string;
  url: string;
  altText: string | null;
  displayOrder: number;
};

export async function getVenuePhotos(tenantId: string): Promise<VenuePhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_photos")
    .select("id, storage_path, alt_text, display_order")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true });

  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const storagePath = row.storage_path as string;
    const { data: pub } = supabase.storage.from("venue-photos").getPublicUrl(storagePath);
    return {
      id: row.id as string,
      storagePath,
      url: pub.publicUrl,
      altText: (row.alt_text as string | null) ?? null,
      displayOrder: (row.display_order as number | null) ?? 0,
    };
  });
}
