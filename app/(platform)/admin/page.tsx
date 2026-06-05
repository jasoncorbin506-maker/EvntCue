import { getAdminOverview } from "@/lib/admin/overview";
import { AdminUserLookup } from "./AdminUserLookup";
import s from "./admin.module.css";

const TYPE_LABEL: Record<string, string> = {
  orgnz: "Orgnz",
  vndr: "Vndr",
  venue: "Venu",
  catr: "Catr",
  plnr: "Plnr",
  admin: "Admin",
};

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className={s.kpi}>
      <div className={s.kpiLabel}>{label}</div>
      <div className={s.kpiValue}>{value}</div>
      {hint && <div className={s.kpiHint}>{hint}</div>}
    </div>
  );
}

export default async function AdminPage() {
  const o = await getAdminOverview();

  return (
    <>
      <h1 className={s.h1}>Overview</h1>

      <div className={s.kpiGrid}>
        <Kpi label="Users" value={o.totalUsers} />
        <Kpi label="Signups · today" value={o.signupsToday} hint="America/Chicago" />
        <Kpi label="Signups · 7d" value={o.signups7d} />
        <Kpi label="Active subs" value={o.activeSubscriptions} />
        <Kpi label="Funded deposits" value={o.fundedDeposits} />
        <Kpi label="Open disputes" value={o.openDisputes} />
        <Kpi label="Suspended" value={o.suspendedTenants} />
      </div>

      <h2 className={s.h2}>Tenants by type</h2>
      <div className={s.kpiGrid}>
        {o.tenantsByType.map((t) => (
          <Kpi key={t.type} label={TYPE_LABEL[t.type] ?? t.type} value={t.count} />
        ))}
      </div>

      <h2 className={s.h2}>User lookup</h2>
      <AdminUserLookup />

      <p className={s.note}>
        Counts include seed fixtures (a seed/real filter is a near-term
        refinement). Suspension email · enforcement gate · appeals land next.
      </p>
    </>
  );
}
