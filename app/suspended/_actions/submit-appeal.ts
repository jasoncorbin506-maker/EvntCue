"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * A suspended user files ONE open appeal from /suspended. Runs under the user's
 * own auth — account_appeals RLS (appeals_own_insert) lets them insert for their
 * own tenant only, even while the enforcement gate bounces them everywhere else.
 * The partial-unique index enforces one-open-at-a-time (23505 → friendly error).
 *
 * Admin notification email rides in a later increment (with the suspension
 * email); the appeal already lands in the board's Appeals view.
 */
export type AppealResult = { ok: true } | { ok: false; error: string };

export async function submitAppeal(input: {
  statement: string;
  contactEmail?: string | null;
}): Promise<AppealResult> {
  const statement = input.statement?.trim();
  if (!statement || statement.length < 10) {
    return { ok: false, error: "Please tell us a bit more (10+ characters)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to appeal." };

  // Attach to the user's suspended tenant.
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id);
  const tenantIds = [
    ...new Set(
      (roleRows ?? [])
        .map((r) => (r as { tenant_id: string | null }).tenant_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (tenantIds.length === 0) return { ok: false, error: "No account found." };

  const { data: suspendedRows } = await supabase
    .from("tenants")
    .select("id")
    .in("id", tenantIds)
    .not("suspended_at", "is", null)
    .limit(1);
  const tenantId = (suspendedRows?.[0] as { id: string } | undefined)?.id;
  if (!tenantId) return { ok: false, error: "Your account isn’t suspended." };

  const { error } = await supabase.from("account_appeals").insert({
    tenant_id: tenantId,
    submitted_by: user.id,
    statement,
    contact_email: input.contactEmail?.trim() || user.email || null,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already have an appeal under review." };
    }
    return { ok: false, error: error.message };
  }

  // Best-effort admin ping (the proactive alert on top of the board's Appeals
  // view). Reads the user's own tenant name for the label.
  const { data: tRow } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", tenantId)
    .maybeSingle();
  const label = (tRow as { name: string | null } | null)?.name ?? tenantId;
  const { notifyAdminsOfAppeal } = await import("@/lib/admin/notify-appeal");
  await notifyAdminsOfAppeal(label);

  return { ok: true };
}
