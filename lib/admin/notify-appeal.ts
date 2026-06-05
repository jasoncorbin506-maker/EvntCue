import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Best-effort: email active admins when a new account appeal lands — the
 * proactive ping on top of the board's Appeals view. Reads ONLY staff_admins +
 * those admins' auth emails (no tenant data), sends, and swallows failures.
 * Never throws — a missing notification must not fail the appeal submission.
 */
export async function notifyAdminsOfAppeal(tenantLabel: string): Promise<void> {
  try {
    const db = createAdminClient();
    const { data: admins } = await db
      .from("staff_admins")
      .select("user_id")
      .is("revoked_at", null);
    const uids = [
      ...new Set((admins ?? []).map((a) => (a as { user_id: string }).user_id)),
    ];
    if (uids.length === 0) return;

    const [{ renderAppealReceivedEmail }, { sendEmail }] = await Promise.all([
      import("@/lib/email/templates/account"),
      import("@/lib/email/send"),
    ]);
    const content = renderAppealReceivedEmail({ tenantLabel });

    for (const uid of uids) {
      const { data } = await db.auth.admin.getUserById(uid);
      const email = data?.user?.email;
      if (!email) continue;
      await sendEmail({
        to: email,
        subject: content.subject,
        text: content.text,
        html: content.html,
        tags: [{ name: "kind", value: "account-appeal" }],
      });
    }
  } catch {
    // best-effort — never blocks the appeal
  }
}
