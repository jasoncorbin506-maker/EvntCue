import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin/current-admin";

/**
 * Admin user-lookup: search by email → every TENANT behind that login. This is
 * how tenant-vs-person resolves in the UI — one human can wear multiple hats, so
 * you see them all and suspend per-row (or all). Service-role read; SELF-GATED
 * on is_admin() (defense in depth — never let this run un-gated).
 */

export type LookupTenant = {
  tenantId: string;
  name: string | null;
  type: string | null;
  role: string | null;
  suspendedAt: string | null;
  suspendedReason: string | null;
};

export type LookupAccount = {
  userId: string;
  email: string | null;
  tenants: LookupTenant[];
};

export async function findAccountsByEmail(
  query: string,
): Promise<LookupAccount[]> {
  if (!(await getAdminUser())) return [];
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const db = createAdminClient();

  // Small user base — list + filter by email substring in JS.
  const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = (listed?.users ?? []).filter((u) =>
    u.email?.toLowerCase().includes(q),
  );
  if (users.length === 0) return [];

  const userIds = users.map((u) => u.id);
  const { data: roleData } = await db
    .from("user_roles")
    .select("user_id, tenant_id, role")
    .in("user_id", userIds);
  const roleRows = (roleData ?? []) as Record<string, unknown>[];

  const tenantIds = [
    ...new Set(roleRows.map((r) => r.tenant_id as string).filter(Boolean)),
  ];
  let tenantRows: Record<string, unknown>[] = [];
  if (tenantIds.length > 0) {
    const { data } = await db
      .from("tenants")
      .select("id, name, type, suspended_at, suspended_reason")
      .in("id", tenantIds);
    tenantRows = (data ?? []) as Record<string, unknown>[];
  }
  const tById = new Map(tenantRows.map((t) => [t.id as string, t]));

  return users.map((u) => {
    const tenants: LookupTenant[] = roleRows
      .filter((r) => r.user_id === u.id)
      .map((r) => {
        const t = tById.get(r.tenant_id as string);
        return {
          tenantId: r.tenant_id as string,
          name: (t?.name as string | null) ?? null,
          type: (t?.type as string | null) ?? null,
          role: (r.role as string | null) ?? null,
          suspendedAt: (t?.suspended_at as string | null) ?? null,
          suspendedReason: (t?.suspended_reason as string | null) ?? null,
        };
      });
    return { userId: u.id, email: u.email ?? null, tenants };
  });
}
