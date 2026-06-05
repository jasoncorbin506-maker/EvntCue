import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin/current-admin";

/**
 * Admin-board KPI counts. Service-role reads (cross-tenant) — the CALLER must
 * have passed `getAdminUser()` first; this module assumes that gate.
 *
 * Pre-Stripe, money is stubbed so "funded deposits" is a COUNT, not revenue.
 * "Today" is an America/Chicago day boundary (DFW) so the morning glance isn't
 * hours off. Counts INCLUDE seed fixtures (most of the 539 tenants) — a
 * seed/real discriminator is a near-term refinement, flagged in the UI.
 */

export type AdminOverview = {
  totalUsers: number;
  signupsToday: number;
  signups7d: number;
  tenantsByType: { type: string; count: number }[];
  suspendedTenants: number;
  activeSubscriptions: number;
  fundedDeposits: number;
  openDisputes: number;
};

const OPEN_DISPUTE_STATUSES = ["open", "under_review", "escalated"];

/** YYYY-MM-DD for an ISO timestamp, in America/Chicago. */
function chicagoDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

const EMPTY_OVERVIEW: AdminOverview = {
  totalUsers: 0,
  signupsToday: 0,
  signups7d: 0,
  tenantsByType: [],
  suspendedTenants: 0,
  activeSubscriptions: 0,
  fundedDeposits: 0,
  openDisputes: 0,
};

export async function getAdminOverview(): Promise<AdminOverview> {
  // Self-gate (defense in depth — never read cross-tenant un-gated).
  if (!(await getAdminUser())) return EMPTY_OVERVIEW;
  const admin = createAdminClient();

  const [tenantsRes, rolesRes, subsRes, depositsRes, disputesRes] =
    await Promise.all([
      admin.from("tenants").select("type, created_at, suspended_at"),
      admin.from("user_roles").select("user_id"),
      admin.from("subscriptions").select("status"),
      admin.from("inquiries").select("deposit_status"),
      admin.from("disputes").select("status"),
    ]);

  const tenants = (tenantsRes.data ?? []) as {
    type: string | null;
    created_at: string | null;
    suspended_at: string | null;
  }[];

  const todayChi = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  });
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const byType = new Map<string, number>();
  let signupsToday = 0;
  let signups7d = 0;
  let suspended = 0;
  for (const t of tenants) {
    const type = t.type ?? "unknown";
    byType.set(type, (byType.get(type) ?? 0) + 1);
    if (t.created_at) {
      if (chicagoDay(t.created_at) === todayChi) signupsToday += 1;
      if (new Date(t.created_at) >= weekAgo) signups7d += 1;
    }
    if (t.suspended_at) suspended += 1;
  }

  const distinctUsers = new Set(
    (rolesRes.data ?? []).map((r) => (r as { user_id: string }).user_id),
  ).size;
  const activeSubscriptions = (subsRes.data ?? []).filter(
    (r) => (r as { status: string }).status === "active",
  ).length;
  const fundedDeposits = (depositsRes.data ?? []).filter(
    (r) => (r as { deposit_status: string | null }).deposit_status === "funded",
  ).length;
  const openDisputes = (disputesRes.data ?? []).filter((r) =>
    OPEN_DISPUTE_STATUSES.includes((r as { status: string }).status),
  ).length;

  return {
    totalUsers: distinctUsers,
    signupsToday,
    signups7d,
    tenantsByType: [...byType.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    suspendedTenants: suspended,
    activeSubscriptions,
    fundedDeposits,
    openDisputes,
  };
}
