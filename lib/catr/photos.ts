import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Caterer portfolio photos for the catr-side profile-edit page (Lock 30 catr
 * tail). Read under the caterer's own RLS (caph_select scopes to own tenant).
 * Resolves the public URL from the catr-photos bucket for immediate rendering.
 * Mirrors lib/venu/photos.ts.
 */
export type CatrPhoto = {
  id: string;
  storagePath: string;
  url: string;
  altText: string | null;
  displayOrder: number;
};

export async function getCatrPhotos(tenantId: string): Promise<CatrPhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catr_photos")
    .select("id, storage_path, alt_text, display_order")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true });

  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const storagePath = row.storage_path as string;
    const { data: pub } = supabase.storage.from("catr-photos").getPublicUrl(storagePath);
    return {
      id: row.id as string,
      storagePath,
      url: pub.publicUrl,
      altText: (row.alt_text as string | null) ?? null,
      displayOrder: (row.display_order as number | null) ?? 0,
    };
  });
}
