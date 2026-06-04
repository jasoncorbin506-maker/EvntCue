import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Planner portfolio photos for the plnr-side profile-edit page (Lock 30 Phase
 * C). Read under the planner's own RLS (planner_photos select scopes to own
 * tenant). Resolves the public URL from the planner-photos bucket for immediate
 * rendering. Mirrors lib/catr/photos.ts.
 */
export type PlnrPhoto = {
  id: string;
  storagePath: string;
  url: string;
  altText: string | null;
  displayOrder: number;
};

export async function getPlnrPhotos(tenantId: string): Promise<PlnrPhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("planner_photos")
    .select("id, storage_path, alt_text, display_order")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true });

  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const storagePath = row.storage_path as string;
    const { data: pub } = supabase.storage.from("planner-photos").getPublicUrl(storagePath);
    return {
      id: row.id as string,
      storagePath,
      url: pub.publicUrl,
      altText: (row.alt_text as string | null) ?? null,
      displayOrder: (row.display_order as number | null) ?? 0,
    };
  });
}
