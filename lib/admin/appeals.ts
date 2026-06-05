import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin/current-admin";

/**
 * Open account appeals for the board's Appeals view. Joins the original
 * suspension reason/note so the admin sees BOTH sides (their statement vs why
 * they were suspended) before upholding or reinstating. Service-role read,
 * SELF-GATED on is_admin().
 */

export type OpenAppeal = {
  id: string;
  tenantId: string;
  tenantName: string | null;
  tenantType: string | null;
  statement: string;
  contactEmail: string | null;
  createdAt: string;
  suspendedReason: string | null;
  suspendedNote: string | null;
};

export async function getOpenAppeals(): Promise<OpenAppeal[]> {
  if (!(await getAdminUser())) return [];
  const db = createAdminClient();

  const { data: appealData } = await db
    .from("account_appeals")
    .select("id, tenant_id, statement, contact_email, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: true });
  const rows = (appealData ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return [];

  const tenantIds = [...new Set(rows.map((r) => r.tenant_id as string))];
  const { data: tenantData } = await db
    .from("tenants")
    .select("id, name, type, suspended_reason, suspended_note")
    .in("id", tenantIds);
  const tById = new Map(
    ((tenantData ?? []) as Record<string, unknown>[]).map((t) => [
      t.id as string,
      t,
    ]),
  );

  return rows.map((r) => {
    const t = tById.get(r.tenant_id as string);
    return {
      id: r.id as string,
      tenantId: r.tenant_id as string,
      tenantName: (t?.name as string | null) ?? null,
      tenantType: (t?.type as string | null) ?? null,
      statement: (r.statement as string) ?? "",
      contactEmail: (r.contact_email as string | null) ?? null,
      createdAt: r.created_at as string,
      suspendedReason: (t?.suspended_reason as string | null) ?? null,
      suspendedNote: (t?.suspended_note as string | null) ?? null,
    };
  });
}
