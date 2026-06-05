"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSuspensionReason } from "@/lib/labels/suspension";

/**
 * Admin moderation — tenant-level suspend / unsuspend. Service-role writes,
 * gated on getAdminUser() (is_admin). Tenant is the primitive ("suspend the
 * person" = call this per tenant). Every action appends to tenant_suspension_log
 * so history survives an unsuspend.
 *
 * LOCKOUT GUARD: refuses to suspend a tenant whose user is an active admin
 * (incl. yourself) — so a fat-finger can't lock you out of the only tool that
 * can unlock you.
 *
 * NOTE: the suspension EMAIL + the per-request enforcement gate + the appeal
 * loop are separate increments — this action only writes state + audit.
 */

export type SuspendResult = { ok: true } | { ok: false; error: string };

export async function suspendTenant(input: {
  tenantId: string;
  reason: string;
  note?: string | null;
}): Promise<SuspendResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!input.tenantId) return { ok: false, error: "Missing tenant." };
  if (!isSuspensionReason(input.reason)) {
    return { ok: false, error: "Pick a reason." };
  }
  const note = input.note?.trim() || null;
  if (input.reason === "other" && !note) {
    return { ok: false, error: "A note is required for ‘Other’." };
  }

  const db = createAdminClient();

  // Lockout guard — never suspend an active admin's account.
  const { data: roleRows } = await db
    .from("user_roles")
    .select("user_id")
    .eq("tenant_id", input.tenantId);
  const targetUserIds = [
    ...new Set((roleRows ?? []).map((r) => (r as { user_id: string }).user_id)),
  ];
  if (targetUserIds.length > 0) {
    const { data: admins } = await db
      .from("staff_admins")
      .select("user_id")
      .in("user_id", targetUserIds)
      .is("revoked_at", null);
    if ((admins ?? []).length > 0) {
      return { ok: false, error: "Can’t suspend an admin’s account." };
    }
  }

  const { error } = await db
    .from("tenants")
    .update({
      suspended_at: new Date().toISOString(),
      suspended_reason: input.reason,
      suspended_note: note,
      suspended_by: admin.userId,
    })
    .eq("id", input.tenantId);
  if (error) return { ok: false, error: error.message };

  await db.from("tenant_suspension_log").insert({
    tenant_id: input.tenantId,
    action: "suspend",
    reason: input.reason,
    note,
    by_user: admin.userId,
  });

  await notifySuspended(db, input.tenantId);

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Best-effort generic suspension email to the tenant's user(s). Never blocks the
 * suspend — a missing email is logged-and-moved-on. Heavy email deps are
 * dynamic-imported (lazy-load rule).
 */
async function notifySuspended(
  db: ReturnType<typeof createAdminClient>,
  tenantId: string,
): Promise<void> {
  try {
    const { data: tRow } = await db
      .from("tenants")
      .select("language_preference")
      .eq("id", tenantId)
      .maybeSingle();
    const locale =
      (tRow as { language_preference?: string } | null)?.language_preference ===
      "es"
        ? "es"
        : "en";

    const { data: roleRows } = await db
      .from("user_roles")
      .select("user_id")
      .eq("tenant_id", tenantId);
    const uids = [
      ...new Set((roleRows ?? []).map((r) => (r as { user_id: string }).user_id)),
    ];
    if (uids.length === 0) return;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://evntcue.com";
    const [{ renderSuspensionEmail }, { sendEmail }] = await Promise.all([
      import("@/lib/email/templates/account"),
      import("@/lib/email/send"),
    ]);
    const content = renderSuspensionEmail({
      appealUrl: `${baseUrl}/login`,
      locale,
    });

    for (const uid of uids) {
      const { data } = await db.auth.admin.getUserById(uid);
      const email = data?.user?.email;
      if (!email) continue;
      await sendEmail({
        to: email,
        subject: content.subject,
        text: content.text,
        html: content.html,
        tags: [{ name: "kind", value: "tenant-suspended" }],
      });
    }
  } catch {
    // best-effort — a missing email never blocks the suspend
  }
}

export async function unsuspendTenant(input: {
  tenantId: string;
  note?: string | null;
}): Promise<SuspendResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!input.tenantId) return { ok: false, error: "Missing tenant." };

  const db = createAdminClient();
  const { error } = await db
    .from("tenants")
    .update({
      suspended_at: null,
      suspended_reason: null,
      suspended_note: null,
      suspended_by: null,
    })
    .eq("id", input.tenantId);
  if (error) return { ok: false, error: error.message };

  await db.from("tenant_suspension_log").insert({
    tenant_id: input.tenantId,
    action: "unsuspend",
    reason: null,
    note: input.note?.trim() || null,
    by_user: admin.userId,
  });

  revalidatePath("/admin");
  return { ok: true };
}
