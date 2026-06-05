"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolve an account appeal — is_admin() gated. Either UPHOLD (mark reviewed,
 * stay suspended) or REINSTATE (mark reviewed + clear the tenant suspension +
 * log the unsuspend). Closes the suspend → email → appeal loop.
 */
export type ResolveResult = { ok: true } | { ok: false; error: string };

export async function resolveAppeal(input: {
  appealId: string;
  decision: "uphold" | "reinstate";
}): Promise<ResolveResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!input.appealId) return { ok: false, error: "Missing appeal." };

  const db = createAdminClient();
  const { data: appeal } = await db
    .from("account_appeals")
    .select("tenant_id")
    .eq("id", input.appealId)
    .maybeSingle();
  const tenantId = (appeal as { tenant_id: string } | null)?.tenant_id;
  if (!tenantId) return { ok: false, error: "Appeal not found." };

  const { error } = await db
    .from("account_appeals")
    .update({
      status: "reviewed",
      reviewed_by: admin.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.appealId);
  if (error) return { ok: false, error: error.message };

  if (input.decision === "reinstate") {
    await db
      .from("tenants")
      .update({
        suspended_at: null,
        suspended_reason: null,
        suspended_note: null,
        suspended_by: null,
      })
      .eq("id", tenantId);
    await db.from("tenant_suspension_log").insert({
      tenant_id: tenantId,
      action: "unsuspend",
      reason: null,
      note: "reinstated via appeal",
      by_user: admin.userId,
    });
  }

  revalidatePath("/admin");
  return { ok: true };
}
